import requests
import json
from datetime import date, datetime

# --- CONFIGURAÇÃO ---
BASE_URL = "http://127.0.0.1:8000"

# --- DADOS DE EXEMPLO ---
# Usaremos estes dicionários para criar, e depois atualizar, nossos itens de teste.
NOVA_JORNADA = {
    "cad_ponto_nome": "Jornada de Teste",
    "cad_ponto_inicio": "09:30:00",
    "cad_ponto_fim": "18:30:00",
    "cad_ponto_pausa": True,
    "cad_ponto_tempo_pausa_min": 75,
    "cad_ponto_tolerancia_min": 15,
    "cad_ponto_dias_semana": "1,2,3"
}

JORNADA_ATUALIZADA = {
    "cad_ponto_nome": "Jornada de Teste ATUALIZADA",
    "cad_ponto_inicio": "08:00:00",
    "cad_ponto_fim": "17:00:00",
    "cad_ponto_pausa": False,
    "cad_ponto_tempo_pausa_min": 0,
    "cad_ponto_tolerancia_min": 5,
    "cad_ponto_dias_semana": "1,2,3,4,5"
}

NOVO_USUARIO = {
    "usu_nome": "Usuário de Teste",
    "usu_email": f"teste.{datetime.now().timestamp()}@email.com",  # Email único para cada execução
    "usu_cpf": f"123.456.789-{str(datetime.now().timestamp())[-2:]}",  # CPF único
    "usu_telefone": "999999999",
    "usu_departamento": "QA",
    "usu_permissao": "Tester",
    "usu_senha": "senha_teste_123"
}

USUARIO_ATUALIZADO = {
    "usu_nome": "Usuário de Teste ATUALIZADO",
    "usu_email": NOVO_USUARIO["usu_email"],  # Email não pode ser alterado aqui no exemplo para simplicidade
    "usu_telefone": "111111111",
    "usu_departamento": "Desenvolvimento",
    "usu_permissao": "Funcionario",
    "usu_ativo": False,
    "nova_senha": "nova_senha_456"
}

NOVO_REGISTRO = {
    "ponto_data": date.today().isoformat(),  # Usa a data de hoje
    "ponto_entrada": f"{date.today().isoformat()}T09:05:00",
    "ponto_saida_almoco": f"{date.today().isoformat()}T12:30:00",
    "ponto_volta_almoco": None,
    "ponto_saida": None,
    "ponto_observacao": "Registro criado via script de teste.",
    "ponto_status": "Incompleto"
}


# --- FUNÇÃO AUXILIAR PARA IMPRIMIR RESULTADOS ---
def print_resultado(response, expected_status):
    """Imprime o resultado de uma requisição de forma legível."""
    status_ok = response.status_code == expected_status
    status_icon = "✅" if status_ok else "❌"

    print(f"  {status_icon} Status Code: {response.status_code} (Esperado: {expected_status})")
    try:
        print(f"  📋 Resposta: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except json.JSONDecodeError:
        print(f"  📋 Resposta: (Não é um JSON válido)")
    print("-" * 50)
    return status_ok


# --- TESTES DE JORNADAS ---
def testar_jornadas():
    print("\n--- INICIANDO TESTES DE JORNADAS ---")
    jornada_id = None

    # 1. Criar uma nova jornada (POST)
    print("1. Testando: POST /jornada/cadastrar")
    response = requests.post(f"{BASE_URL}/jornada/cadastrar", json=NOVA_JORNADA)
    if not print_resultado(response, 201):
        print("ERRO: Não foi possível criar a jornada. Abortando testes de jornada.")
        return

    # 2. Listar todas as jornadas e pegar o ID da que acabamos de criar (GET)
    print("2. Testando: GET /jornada/listar")
    response = requests.get(f"{BASE_URL}/jornada/listar")
    if print_resultado(response, 200):
        try:
            jornadas = response.json()
            jornada_id = jornadas[-1]['cad_id']  # Pega o ID da última jornada da lista
            print(f"  -> Jornada de teste criada com ID: {jornada_id}")
        except (IndexError, KeyError):
            print("ERRO: A resposta da listagem não continha a jornada esperada.")
            return

    if not jornada_id:
        return

    # 3. Buscar a jornada específica pelo ID (GET)
    print(f"3. Testando: GET /jornada/{jornada_id}")
    response = requests.get(f"{BASE_URL}/jornada/{jornada_id}")
    print_resultado(response, 200)

    # 4. Atualizar a jornada (PUT)
    print(f"4. Testando: PUT /jornada/editar/{jornada_id}")
    response = requests.put(f"{BASE_URL}/jornada/editar/{jornada_id}", json=JORNADA_ATUALIZADA)
    print_resultado(response, 200)

    # 5. Deletar a jornada (DELETE)
    print(f"5. Testando: DELETE /jornada/deletar/{jornada_id}")
    response = requests.delete(f"{BASE_URL}/jornada/deletar/{jornada_id}")
    print_resultado(response, 200)

    # 6. Verificar se a jornada foi realmente deletada (GET deve retornar 404)
    print(f"6. Verificando deleção: GET /jornada/{jornada_id}")
    response = requests.get(f"{BASE_URL}/jornada/{jornada_id}")
    print_resultado(response, 404)


# --- TESTES DE USUÁRIOS ---
def testar_usuarios():
    print("\n--- INICIANDO TESTES DE USUÁRIOS ---")
    usuario_id = None

    # 1. Criar novo usuário (POST)
    print("1. Testando: POST /usuario/cadastrar")
    response = requests.post(f"{BASE_URL}/usuario/cadastrar", json=NOVO_USUARIO)
    if not print_resultado(response, 201):
        print("ERRO: Não foi possível criar o usuário. Abortando testes de usuário.")
        return

    # 2. Listar usuários e pegar o ID
    print("2. Testando: GET /usuario/listar")
    response = requests.get(f"{BASE_URL}/usuario/listar")
    if print_resultado(response, 200):
        try:
            usuarios = response.json()
            # Encontra o usuário pelo email único que criamos
            usuario_criado = next(u for u in usuarios if u['usu_email'] == NOVO_USUARIO['usu_email'])
            usuario_id = usuario_criado['usu_id']
            print(f"  -> Usuário de teste criado com ID: {usuario_id}")
        except (StopIteration, KeyError):
            print("ERRO: A resposta da listagem não continha o usuário esperado.")
            return

    if not usuario_id:
        return

    # 3. Buscar usuário por ID (GET)
    print(f"3. Testando: GET /usuario/{usuario_id}")
    response = requests.get(f"{BASE_URL}/usuario/{usuario_id}")
    print_resultado(response, 200)

    # 4. Atualizar usuário (PUT)
    print(f"4. Testando: PUT /usuario/editar/{usuario_id}")
    response = requests.put(f"{BASE_URL}/usuario/editar/{usuario_id}", json=USUARIO_ATUALIZADO)
    print_resultado(response, 200)

    # 5. Deletar usuário (DELETE)
    print(f"5. Testando: DELETE /usuario/deletar/{usuario_id}")
    response = requests.delete(f"{BASE_URL}/usuario/deletar/{usuario_id}")
    print_resultado(response, 200)

    # 6. Verificar se o usuário foi deletado (GET deve retornar 404)
    print(f"6. Verificando deleção: GET /usuario/{usuario_id}")
    response = requests.get(f"{BASE_URL}/usuario/{usuario_id}")
    print_resultado(response, 404)


# --- TESTES DE REGISTROS DE PONTO ---
def testar_registros_ponto():
    print("\n--- INICIANDO TESTES DE REGISTROS DE PONTO ---")
    registro_id = None

    # 1. Registrar um ponto para hoje (POST)
    print("1. Testando: POST /ponto/registrar")
    response = requests.post(f"{BASE_URL}/ponto/registrar", json=NOVO_REGISTRO)
    if not print_resultado(response, 201):
        # Pode falhar se já existir um ponto para hoje. Isso é esperado.
        print("AVISO: Falha ao criar registro. Pode ser que já exista um para hoje. Tentando continuar os testes...")

    # 2. Listar todos os registros (GET)
    print("2. Testando: GET /ponto/listar")
    response = requests.get(f"{BASE_URL}/ponto/listar")
    if print_resultado(response, 200):
        try:
            registros = response.json()
            registro_criado = next(r for r in registros if r['ponto_data'] == NOVO_REGISTRO['ponto_data'])
            registro_id = registro_criado['ponto_id']
            print(f"  -> Registro de teste encontrado com ID: {registro_id}")
        except (StopIteration, KeyError):
            print("ERRO: Não foi possível encontrar o registro de hoje na listagem.")

    # 3. Buscar registro de hoje pelo endpoint /hoje (GET)
    print("3. Testando: GET /ponto/hoje")
    response = requests.get(f"{BASE_URL}/ponto/hoje")
    print_resultado(response, 200)

    # 4. Buscar registro de hoje pelo endpoint de data (GET)
    hoje = date.today().isoformat()
    print(f"4. Testando: GET /ponto/data/{hoje}")
    response = requests.get(f"{BASE_URL}/ponto/data/{hoje}")
    print_resultado(response, 200)

    # 5. Buscar um registro que não existe (GET)
    data_futura = "2099-12-31"
    print(f"5. Testando busca por data inexistente: GET /ponto/data/{data_futura}")
    response = requests.get(f"{BASE_URL}/ponto/data/{data_futura}")
    print_resultado(response, 404)

    # OBS: Não há rotas de editar/deletar para registros de ponto, então o teste para aqui.


if __name__ == "__main__":
    print("=" * 50)
    print("INICIANDO SCRIPT DE TESTE DA API DE PONTO")
    print("=" * 50)

    testar_jornadas()
    testar_usuarios()
    testar_registros_ponto()

    print("\n--- FIM DOS TESTES ---")