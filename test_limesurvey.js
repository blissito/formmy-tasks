const axios = require('axios');

const LIMESURVEY_URL = 'https://limesurvey-app.fly.dev/index.php/admin/remotecontrol';
const username = 'admin';
const password = 'Poweroso77';

async function testLimeSurveyAPI() {
    let sessionKey = null;
    
    try {
        console.log('🔑 Obteniendo session key...');
        
        // 1. Obtener session key (login)
        const loginResponse = await axios.post(LIMESURVEY_URL, {
            method: 'get_session_key',
            params: [username, password],
            jsonrpc: '2.0',
            id: 1
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Login response:', loginResponse.data);

        if (loginResponse.data.error) {
            throw new Error(`LimeSurvey API Error: ${loginResponse.data.error.message || 'Unknown error'}`);
        }

        sessionKey = loginResponse.data.result;
        console.log('✅ Session key obtenido:', sessionKey);

        // 2. Listar surveys
        console.log('📋 Listando surveys...');
        const surveysResponse = await axios.post(LIMESURVEY_URL, {
            method: 'list_surveys',
            params: [sessionKey],
            jsonrpc: '2.0',
            id: 1
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Surveys response:', surveysResponse.data);

        if (surveysResponse.data.error) {
            throw new Error(`LimeSurvey API Error: ${surveysResponse.data.error.message || 'Unknown error'}`);
        }

        console.log('✅ Resultado:', surveysResponse.data.result);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    } finally {
        // Liberar session key
        if (sessionKey) {
            try {
                await axios.post(LIMESURVEY_URL, {
                    method: 'release_session_key',
                    params: [sessionKey],
                    jsonrpc: '2.0',
                    id: 1
                });
                console.log('🔓 Session key liberado');
            } catch (error) {
                console.log('⚠️  Error liberando session key (no crítico)');
            }
        }
    }
}

testLimeSurveyAPI();