import math

# Configuração do avião: 5 fileiras (A-E), 10 assentos por fileira = 50 assentos
fileiras = ["A", "B", "C", "D", "E"]
assentos = {f"{f}{n}": False for f in fileiras for n in range(1, 11)}  # False = livre, True = ocupado


def mostrar_assentos():
    print("\n=== PAINEL DE ASSENTOS ===")
    for f in fileiras:
        linha = []
        for n in range(1, 11):
            codigo = f"{f}{n}"
            if assentos[codigo]:
                linha.append("[X]")  # Ocupado
            else:
                linha.append(f"[{codigo}]")  # Disponível
        print(" ".join(linha))
    print()


def check_in():
    mostrar_assentos()
    escolha = input("Digite o código do assento que deseja (ex: B4): ").upper()

    # Validação
    if escolha not in assentos:
        print("❌ Assento inválido! Tente novamente.")
        return

    if assentos[escolha]:
        print("❌ Esse assento já está ocupado! Escolha outro.")
        return

    # Confirmar
    assentos[escolha] = True
    print(f"✅ Check-in realizado no assento {escolha} com sucesso!")


def estatisticas():
    ocupados = sum(1 for ocupado in assentos.values() if ocupado)
    total = len(assentos)
    porcentagem = (ocupados / total) * 100
    print("\n=== ESTATÍSTICAS DO VOO ===")
    print(f"Total de assentos: {total}")
    print(f"Ocupados: {ocupados}")
    print(f"Livres: {total - ocupados}")
    print(f"Taxa de ocupação: {porcentagem:.2f}%")
    print("Encerrando o programa... 👋")


def menu():
    while True:
        print("\n=== SISTEMA DE CHECK-IN ===")
        print("1. Fazer check-in")
        print("2. Encerrar programa")

        opcao = input("Escolha uma opção: ")

        if opcao == "1":
            check_in()
        elif opcao == "2":
            estatisticas()
            break
        else:
            print("❌ Opção inválida, tente novamente.")


# Executar o programa
menu()
