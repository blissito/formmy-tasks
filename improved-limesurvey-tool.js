const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const func = async (command) => {
    try {
        console.log(`Ejecutando comando LimeSurvey: lime ${command}`);
        
        // Verificar que el comando lime existe
        try {
            await execAsync('which lime');
        } catch (error) {
            return `Error: El CLI 'lime' no está instalado o no está en el PATH. Instala LimeSurvey CLI primero.`;
        }
        
        const { stdout, stderr } = await execAsync(`lime ${command}`, {
            timeout: 30000, // 30 segundos timeout
            encoding: 'utf8'
        });
        
        // Log detallado para debug
        console.log('STDOUT:', stdout);
        console.log('STDERR:', stderr);
        
        if (stderr) {
            // Algunos comandos pueden tener warnings en stderr pero ser exitosos
            if (stderr.toLowerCase().includes('error') || stderr.toLowerCase().includes('failed')) {
                console.error('Error detectado en stderr:', stderr);
                return `Error ejecutando comando: ${stderr}`;
            } else {
                console.warn('Warning en stderr (no crítico):', stderr);
            }
        }
        
        if (!stdout || stdout.trim() === '') {
            return `Comando ejecutado, pero no hubo salida. Esto podría indicar un problema con el CLI de LimeSurvey.`;
        }
        
        console.log('Comando ejecutado exitosamente:', stdout);
        return stdout.trim();
        
    } catch (error) {
        console.error('Error capturado ejecutando LimeSurvey CLI:', error);
        
        // Mensaje más descriptivo basado en el tipo de error
        if (error.code === 'ENOENT') {
            return `Error: El comando 'lime' no fue encontrado. Verifica que LimeSurvey CLI esté instalado y en el PATH.`;
        } else if (error.signal === 'SIGTERM' || error.code === 'ETIMEDOUT') {
            return `Error: El comando tardó demasiado en ejecutarse (timeout). Verifica la conectividad con LimeSurvey.`;
        } else if (error.code) {
            return `Error (código ${error.code}): ${error.message}. Stdout: ${error.stdout || 'vacío'}, Stderr: ${error.stderr || 'vacío'}`;
        } else {
            return `Error desconocido: ${error.message}`;
        }
    }
};

return func;