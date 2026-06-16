# Dextro IoT - TestBench (E2E Validation)

Orquestrador de testes de integração ponta-a-ponta para validar a compatibilidade entre o Backend NestJS e os dispositivos nativos (C/C++).

## 🚀 Como funciona

O TestBench utiliza **TestContainers** para automatizar o ambiente de simulação:
1.  Sobe uma instância isolada do **EMQX Broker**.
2.  Inicia um **Mock do Backend** (usando a lógica do `DextroIotModule`) configurado com Shared Subscriptions.
3.  Compila e executa o **Binário Nativo C++** real.
4.  Valida o handshake mTLS e o envio de Heartbeat.

## 🛠️ Pré-requisitos

- Docker instalado.
- Node.js 20+.
- Compilador C++ (g++) e CMake (para o teste nativo).

## 💻 Executando a Simulação

```bash
npm install
node index.js
```

## 🔍 O que é Validado

- **Shared Subscriptions**: Garante que o balanceamento entre PODs do backend funciona.
- **RPC Routing**: Valida que o decorador `@RemoteProcedure` no backend recebe o sinal do device.
- **mTLS Readiness**: Verifica se os certificados gerados pela CA interna são aceitos pelo broker.
