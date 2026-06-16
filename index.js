const { GenericContainer } = require("testcontainers");
const mqtt = require("mqtt");
const axios = require("axios");

async function runTestBench() {
    console.log("🚀 Iniciando Dextro IoT TestBench...");

    // 1. Sobe o EMQX
    const emqxContainer = await new GenericContainer("emqx:5.4")
        .withExposedPorts(1883)
        .start();
    
    const mqttPort = emqxContainer.getMappedPort(1883);
    console.log(`✅ EMQX rodando na porta ${mqttPort}`);

    // 2. Mock do Backend NestJS (Simulado via script)
    // Em um cenário real, rodaríamos o container do nestjs-iot
    console.log("🛠️  Simulando Backend IoT...");
    
    const client = mqtt.connect(`mqtt://localhost:${mqttPort}`);
    
    let backendReady = false;
    client.on("connect", () => {
        console.log("📡 Backend (Mock) conectado ao EMQX");
        // Subscreve via tópico direto para o teste
        client.subscribe("#", { qos: 0 }, () => {
            console.log("✅ Backend Subscrito em TUDO (#)");
            client.publish("test/self", "hello", () => {
                console.log("📤 Teste de auto-publicação enviado");
            });
            backendReady = true;
        });
    });

    client.on("error", (err) => {
        console.error("❌ Erro no Backend Client:", err);
    });

    client.on("offline", () => {
        console.warn("⚠️ Backend Client Offline");
    });

    client.on("message", (topic, message) => {
        console.log(`DEBUG: Backend recebeu mensagem no tópico [${topic}]`);
        const parts = topic.split("/");
        const deviceId = parts[1];
        const procName = parts[3];
        console.log(`📩 Recebido RPC [${procName}] do Device [${deviceId}]`);
        
        if (procName === "heartbeat") {
            console.log(`💓 Heartbeat de ${deviceId} processado.`);
        }
    });

    // 3. Executa o Binário Nativo C++
    while (!backendReady) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log("🤖 Iniciando Binário Nativo [DEV-NATIVE-001]...");
    const { spawn } = require("child_process");
    
    const binaryPath = process.env.IOT_BINARY_PATH || "/home/devel/dextro-iot/dextro-iot-cpp/build/examples/iot-example";
    console.log(`🔍 Usando binário em: ${binaryPath}`);
    const nativeProc = spawn(binaryPath, ["127.0.0.1", mqttPort]);

    nativeProc.stdout.on("data", (data) => {
        console.log(`🖥️  [Native Out]: ${data}`);
    });

    nativeProc.stderr.on("data", (data) => {
        console.error(`❌ [Native Err]: ${data}`);
    });

    // Aguarda 15s para validação
    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log("🏁 TestBench Finalizado.");
    await emqxContainer.stop();
    process.exit(0);
}

runTestBench().catch(console.error);
