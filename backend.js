// Exemplo de lógica para o seu servidor (Node.js)
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient('SUA_URL_SUPABASE', 'SUA_CHAVE_ANON');
const resend = new Resend('SUA_API_KEY_RESEND');

async function processarDenuncia(req, res) {
    const { protocolo, categoria, alvo, relato, email_usuario } = req.body;

    // 1. Salva no Banco de Dados
    const { data, error } = await supabase
        .from('denuncias')
        .insert([{ protocolo, categoria, alvo, relato, email_usuario }]);

    // 2. Busca se já existem outras denúncias para o mesmo alvo
    const { count } = await supabase
        .from('denuncias')
        .select('*', { count: 'exact', head: true })
        .eq('alvo', alvo)
        .eq('categoria', categoria);

    // 3. Inteligência de Agrupamento: Se houver 2 ou mais, avisa o responsável
    if (count >= 2) {
        await resend.emails.send({
            from: 'Sistema Reclame <alertas@reclamacao.com>',
            to: ['responsavel@suainstituicao.com'], // E-mail de quem vai resolver
            subject: `ALERTA: Múltiplas ocorrências - ${alvo}`,
            html: `<p>O <strong>${alvo}</strong> recebeu ${count} reclamações na categoria <strong>${categoria}</strong>.</p>
                   <p><strong>Último relato:</strong> ${relato}</p>
                   <p>Consulte o painel para ver todos os detalhes.</p>`
        });
    }

    res.status(200).json({ message: "Processado com sucesso" });
}