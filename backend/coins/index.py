import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """Возвращает список монет из каталога с историей цен"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    params = event.get('queryStringParameters') or {}
    search = params.get('search', '').strip().lower()
    metal = params.get('metal', '')
    rarity = params.get('rarity', '')
    coin_id = params.get('id', '')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    schema = 't_p56980273_numismatic_database_'

    if coin_id:
        cur.execute(f"""
            SELECT id, name, year, country, metal, weight_g, diameter_mm, mintage,
                   rarity, condition, base_price, current_price, description,
                   ruler, dynasty, mint, image_url, tags
            FROM {schema}.coins WHERE id = %s
        """, (coin_id,))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return {'statusCode': 404, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Not found'})}

        cur.execute(f"""
            SELECT price, recorded_at, source, notes
            FROM {schema}.coin_price_history
            WHERE coin_id = %s ORDER BY recorded_at
        """, (coin_id,))
        history = [{'price': float(r[0]), 'date': r[1].isoformat(), 'source': r[2], 'notes': r[3]} for r in cur.fetchall()]

        coin = _row_to_dict(row, history)
        cur.close(); conn.close()
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps(coin, ensure_ascii=False)
        }

    where_clauses = []
    query_params = []

    if search:
        where_clauses.append("(LOWER(name) LIKE %s OR LOWER(country) LIKE %s OR %s = ANY(SELECT LOWER(t) FROM UNNEST(tags) t))")
        query_params += [f'%{search}%', f'%{search}%', search]
    if metal:
        where_clauses.append("metal = %s")
        query_params.append(metal)
    if rarity:
        where_clauses.append("rarity = %s")
        query_params.append(rarity)

    where_sql = ('WHERE ' + ' AND '.join(where_clauses)) if where_clauses else ''

    cur.execute(f"""
        SELECT id, name, year, country, metal, weight_g, diameter_mm, mintage,
               rarity, condition, base_price, current_price, description,
               ruler, dynasty, mint, image_url, tags
        FROM {schema}.coins
        {where_sql}
        ORDER BY year
    """, query_params)
    rows = cur.fetchall()

    ids = [r[0] for r in rows]
    history_map = {}
    if ids:
        cur.execute(f"""
            SELECT coin_id, price, recorded_at, source, notes
            FROM {schema}.coin_price_history
            WHERE coin_id = ANY(%s)
            ORDER BY coin_id, recorded_at
        """, (ids,))
        for h in cur.fetchall():
            history_map.setdefault(h[0], []).append({
                'price': float(h[1]),
                'date': h[2].isoformat(),
                'source': h[3],
                'notes': h[4]
            })

    coins = [_row_to_dict(r, history_map.get(r[0], [])) for r in rows]

    cur.execute(f"SELECT DISTINCT metal FROM {schema}.coins ORDER BY metal")
    metals = [r[0] for r in cur.fetchall()]

    cur.execute(f"SELECT DISTINCT rarity FROM {schema}.coins ORDER BY rarity")
    rarities = [r[0] for r in cur.fetchall()]

    cur.close(); conn.close()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'coins': coins, 'metals': metals, 'rarities': rarities, 'total': len(coins)}, ensure_ascii=False)
    }


def _row_to_dict(row, history):
    return {
        'id': row[0],
        'name': row[1],
        'year': row[2],
        'country': row[3],
        'metal': row[4],
        'weight_g': float(row[5]) if row[5] else None,
        'diameter_mm': float(row[6]) if row[6] else None,
        'mintage': row[7],
        'rarity': row[8],
        'condition': row[9],
        'base_price': float(row[10]) if row[10] else None,
        'current_price': float(row[11]) if row[11] else None,
        'description': row[12],
        'ruler': row[13],
        'dynasty': row[14],
        'mint': row[15],
        'image_url': row[16],
        'tags': row[17] or [],
        'price_history': history
    }
