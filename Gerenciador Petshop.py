import sqlite3

# Conexão com o banco de dados
conn = sqlite3.connect("petshop.db")
cursor = conn.cursor()

# Criação das tabelas
cursor.execute("""
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    telefone TEXT,
    endereco TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    especie TEXT,
    idade INTEGER,
    dono_id INTEGER,
    FOREIGN KEY(dono_id) REFERENCES clientes(id)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS servicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER,
    tipo TEXT,
    data TEXT,
    preco REAL,
    FOREIGN KEY(pet_id) REFERENCES pets(id)
)
""")

conn.commit()

# Funções do sistema
def cadastrar_cliente():
    nome = input("Nome do cliente: ")
    telefone = input("Telefone: ")
    endereco = input("Endereço: ")
    cursor.execute("INSERT INTO clientes (nome, telefone, endereco) VALUES (?, ?, ?)", (nome, telefone, endereco))
    conn.commit()
    print("✅ Cliente cadastrado com sucesso!")

def cadastrar_pet():
    nome = input("Nome do pet: ")
    especie = input("Espécie (cachorro, gato, etc): ")
    idade = int(input("Idade: "))
    dono_id = int(input("ID do dono: "))
    cursor.execute("INSERT INTO pets (nome, especie, idade, dono_id) VALUES (?, ?, ?, ?)", (nome, especie, idade, dono_id))
    conn.commit()
    print("✅ Pet cadastrado com sucesso!")

def listar_clientes():
    cursor.execute("SELECT * FROM clientes")
    for row in cursor.fetchall():
        print(row)

def listar_pets():
    cursor.execute("SELECT * FROM pets")
    for row in cursor.fetchall():
        print(row)

def agendar_servico():
    pet_id = int(input("ID do pet: "))
    tipo = input("Tipo de serviço (banho, tosa, consulta...): ")
    data = input("Data (dd/mm/aaaa): ")
    preco = float(input("Preço: "))
    cursor.execute("INSERT INTO servicos (pet_id, tipo, data, preco) VALUES (?, ?, ?, ?)", (pet_id, tipo, data, preco))
    conn.commit()
    print("✅ Serviço agendado com sucesso!")

def listar_servicos():
    cursor.execute("""
    SELECT servicos.id, pets.nome, servicos.tipo, servicos.data, servicos.preco
    FROM servicos
    JOIN pets ON servicos.pet_id = pets.id
    """)
    for row in cursor.fetchall():
        print(row)

# Menu principal
def menu():
    while True:
        print("\n=== SISTEMA PETSHOP ===")
        print("1. Cadastrar cliente")
        print("2. Cadastrar pet")
        print("3. Listar clientes")
        print("4. Listar pets")
        print("5. Agendar serviço")
        print("6. Listar serviços")
        print("0. Sair")

        opcao = input("Escolha uma opção: ")

        if opcao == "1":
            cadastrar_cliente()
        elif opcao == "2":
            cadastrar_pet()
        elif opcao == "3":
            listar_clientes()
        elif opcao == "4":
            listar_pets()
        elif opcao == "5":
            agendar_servico()
        elif opcao == "6":
            listar_servicos()
        elif opcao == "0":
            print("Saindo... 👋")
            break
        else:
            print("Opção inválida!")

menu()
conn.close()
