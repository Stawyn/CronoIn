import sqlite3
from datetime import date
import sys, os

# ensure repo root is in path so imports like Backend.* work from tests
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Import the function under test
from Backend.Jornada.JornadaListar import buscar_jornada_de_hoje


def setup_db():
    con = sqlite3.connect(':memory:')
    con.row_factory = sqlite3.Row
    cur = con.cursor()

    # Create minimal schema required
    cur.execute('''
        CREATE TABLE USUARIOS (
            usu_id INTEGER PRIMARY KEY AUTOINCREMENT,
            usu_nome TEXT,
            usu_email TEXT
        )
    ''')

    cur.execute('''
        CREATE TABLE CADASTRO_PONTOS (
            cad_id INTEGER PRIMARY KEY AUTOINCREMENT,
            usu_id INTEGER,
            cad_ponto_nome TEXT,
            cad_ponto_inicio TEXT,
            cad_ponto_fim TEXT,
            cad_ponto_dias_semana TEXT,
            cad_info_data_criacao TEXT
        )
    ''')

    cur.execute('''
        CREATE TABLE USUARIO_JORNADA (
            uj_id INTEGER PRIMARY KEY AUTOINCREMENT,
            usu_id INTEGER NOT NULL,
            cad_id INTEGER NOT NULL,
            uj_data_inicio DATE NOT NULL,
            uj_data_fim DATE,
            uj_ativo BOOLEAN DEFAULT 1
        )
    ''')

    cur.execute('''
        CREATE TABLE JORNADA_CALENDARIO (
            cal_id INTEGER PRIMARY KEY AUTOINCREMENT,
            cad_id INTEGER NOT NULL,
            data DATE NOT NULL,
            tipo TEXT NOT NULL
        )
    ''')

    cur.execute('''
        CREATE TABLE JORNADA_SEMANAL (
            js_id INTEGER PRIMARY KEY AUTOINCREMENT,
            cad_id INTEGER NOT NULL,
            dia_semana INTEGER NOT NULL,
            habilitado BOOLEAN NOT NULL,
            tipo TEXT NOT NULL,
            entrada1 TEXT,
            saida1 TEXT,
            entrada2 TEXT,
            saida2 TEXT
        )
    ''')

    con.commit()
    return con


def test_jornada_via_cadastro_usu_id():
    con = setup_db()
    cur = con.cursor()
    # Insert a user
    cur.execute("INSERT INTO USUARIOS (usu_id, usu_nome) VALUES (?,?)", (1, 'User A'))

    # Insert a jornada with usu_id = 1 and dias_semana containing today's code
    hoje = date.today()
    weekday = hoje.weekday()  # 0..6 (Mon..Sun)
    dia_codigo = str((weekday + 1) % 7)  # same mapping as code under test

    cur.execute(
        "INSERT INTO CADASTRO_PONTOS (cad_id, usu_id, cad_ponto_nome, cad_ponto_inicio, cad_ponto_fim, cad_ponto_dias_semana, cad_info_data_criacao) VALUES (?,?,?,?,?,?, datetime('now'))",
        (10, 1, 'Jornada A', '08:00:00', '17:00:00', dia_codigo)
    )
    con.commit()

    jornada = buscar_jornada_de_hoje(usu_id=1, con=con)
    assert jornada is not None
    assert jornada.get('cad_id') == 10
    print('test_jornada_via_cadastro_usu_id PASSED')


def test_jornada_via_usuario_jornada():
    con = setup_db()
    cur = con.cursor()
    # Insert a user
    cur.execute("INSERT INTO USUARIOS (usu_id, usu_nome) VALUES (?,?)", (2, 'User B'))

    hoje = date.today()
    weekday = hoje.weekday()
    dia_codigo = str((weekday + 1) % 7)

    # Insert a jornada sem usu_id
    cur.execute(
        "INSERT INTO CADASTRO_PONTOS (cad_id, usu_id, cad_ponto_nome, cad_ponto_inicio, cad_ponto_fim, cad_ponto_dias_semana, cad_info_data_criacao) VALUES (?,?,?,?,?,?, datetime('now'))",
        (20, None, 'Jornada B', '09:00:00', '18:00:00', dia_codigo)
    )

    # Associate user 2 to jornada 20
    cur.execute(
        "INSERT INTO USUARIO_JORNADA (uj_id, usu_id, cad_id, uj_data_inicio, uj_data_fim, uj_ativo) VALUES (?,?,?,?,?,?)",
        (1, 2, 20, hoje.isoformat(), None, 1)
    )
    con.commit()

    jornada = buscar_jornada_de_hoje(usu_id=2, con=con)
    assert jornada is not None
    assert jornada.get('cad_id') == 20
    print('test_jornada_via_usuario_jornada PASSED')


if __name__ == '__main__':
    test_jornada_via_cadastro_usu_id()
    test_jornada_via_usuario_jornada()

