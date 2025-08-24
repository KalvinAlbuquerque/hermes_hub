// Arquivo: frontend/src/app/manual/page.tsx

"use client";

import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import DocSection from "@/components/DocSection";
import DocNav from "@/components/DocNav";
import Link from "next/link";

// 1. ADICIONADO "Configurações da Empresa" AO MENU DE NAVEGAÇÃO
const sections = [
    { id: "visao-geral", title: "Visão Geral" },
    { id: "guia-usuario", title: "Guia do Usuário" },
    { id: "ciclo-de-vida", title: "O Ciclo de Vida do Incidente" },
    { id: "variaveis", title: "Variáveis e Palavras Reservadas" },
    { id: "guia-admin", title: "Guia do Administrador" },
    { id: "perfis-permissoes", title: "Perfis de Permissão" },
    { id: "clientes", title: "Clientes" },
    { id: "config-empresa", title: "Configurações da Empresa" },
    { id: "aprovacoes", title: "Aprovações e Autoaprovação" },
    { id: "recursos-adicionais", title: "Recursos Adicionais" },
    { id: "config-gmail-imap", title: "Gmail: Configurando Envio e Respostas" },
];


function ManualPage() {
    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-3">
                    <div className="card w-full">
                        <header className="text-center mb-12">
                            <h1 className="text-4xl font-extrabold text-foreground">Manual de Uso do Hermes Hub</h1>
                            <p className="mt-2 text-lg text-muted-foreground">Seu guia completo para notificação e gerenciamento de incidentes.</p>
                        </header>

                        <DocSection title="Visão Geral" id="visao-geral">
                            <p>
                                O Hermes Hub é uma plataforma centralizada projetada para simplificar e automatizar o processo de notificação de incidentes.
                                Ele permite que administradores criem templates de e-mail, gerenciem listas de destinatários (Clientes) e enviem comunicações de forma rápida e segura, com um fluxo de aprovação integrado.
                            </p>
                            <ul>
                                <li><strong>Envio Padronizado:</strong> Utilize templates pré-aprovados para garantir consistência e agilidade na comunicação.</li>
                                <li><strong>Fluxo de Aprovação:</strong> Submeta notificações para aprovação de usuários com permissão, garantindo a qualidade e a precisão das informações enviadas.</li>
                                <li><strong>Gerenciamento de Incidentes:</strong> Acompanhe o ciclo de vida de cada notificação, desde a abertura até o fechamento, com status claros e um histórico completo.</li>
                                <li><strong>Detecção de Respostas:</strong> O sistema monitora uma caixa de entrada e detecta automaticamente quando um destinatário responde a uma notificação, pausando o incidente para análise.</li>
                                <li><strong>Administração Completa:</strong> Gerencie usuários, perfis de permissão, clientes, templates, categorias de SLA e contas de e-mail em um só lugar.</li>
                            </ul>
                        </DocSection>

                        <DocSection title="Guia do Usuário" id="guia-usuario">
                            <h3 className="text-xl font-semibold text-foreground">Enviando uma Notificação</h3>
                            <p>
                                O envio de notificações é o coração do sistema. O processo é dividido em 3 passos para garantir precisão e flexibilidade:
                            </p>
                            <ol>
                                <li><strong>Passo 1: Configuração e Destinatários:</strong>
                                    <ul>
                                        <li><strong>Remetente:</strong> Escolha a conta de e-mail que fará o envio.</li>
                                        <li><strong>Template:</strong> Selecione o modelo de e-mail. Campos dinâmicos (variáveis) como `[*Nome do Cliente]` aparecerão automaticamente para serem preenchidos.</li>
                                        <li><strong>Destinatários:</strong> Você pode selecionar Clientes pré-cadastrados ou inserir e-mails manualmente.</li>
                                        <li><strong>Anexos:</strong> Adicione arquivos que serão enviados junto com a notificação.</li>
                                    </ul>
                                </li>
                                <li><strong>Passo 2: Edição do Conteúdo:</strong> Após preencher as variáveis, o sistema gera uma prévia do e-mail. Aqui você pode fazer ajustes finos no texto ou colar imagens diretamente no corpo do e-mail.</li>
                                <li><strong>Passo 3: Revisão Final:</strong> Uma última tela mostra um resumo completo de tudo (remetente, destinatários, assunto, corpo do e-mail) antes de submeter para aprovação ou enviar diretamente.</li>
                            </ol>
                        </DocSection>

                        <DocSection title="O Ciclo de Vida do Incidente" id="ciclo-de-vida">
                            <p>
                                A tela de <Link href="/incidents" className="text-primary hover:underline">Gerenciar Incidentes</Link> é onde você acompanha o ciclo de vida de cada notificação enviada. Os status indicam a situação atual:
                            </p>
                            <ul>
                                <li><strong>Aberto (Amarelo):</strong> O incidente foi criado e a notificação inicial enviada. O sistema está no modo ativo, aguardando uma resposta ou pronto para enviar lembretes automáticos com base nas regras de SLA da categoria do template.</li>
                                <li><strong>Pausado (Azul):</strong> O ciclo de lembretes automáticos foi interrompido. Isso pode acontecer por dois motivos: um analista pausou o incidente manualmente ou o sistema detectou uma resposta do cliente via e-mail. Um incidente pausado precisa de atenção manual para ser reaberto ou fechado.</li>
                                <li><strong>Respondido (Roxo):</strong> Esta é uma tag visual que aparece junto com o status "Pausado". Ela indica especificamente que o sistema detectou uma resposta do destinatário para aquela notificação.</li>
                                <li><strong>Fechado (Verde):</strong> O incidente foi considerado resolvido e foi finalizado por um analista. Um incidente fechado não enviará mais lembretes.</li>
                            </ul>
                        </DocSection>

                        <DocSection title="Variáveis e Palavras Reservadas" id="variaveis">
                            <p>
                                Para tornar as comunicações dinâmicas, o Hermes Hub utiliza um sistema de variáveis. Elas são textos entre colchetes `[]` que são substituídos por informações específicas no momento do envio.
                            </p>
                            <h3 className="text-xl font-semibold text-foreground mt-6">Variáveis Definidas pelo Usuário</h3>
                            <ul>
                                <li><strong>Variável Padrão:</strong> `[Nome do Cliente]` - Na tela de envio, aparecerá um campo chamado "Nome do Cliente" para ser preenchido.</li>
                                <li><strong>Variável Obrigatória:</strong> `[*Assunto Principal]` - Ao adicionar um asterisco `*` no início, o campo se torna de preenchimento obrigatório.</li>
                            </ul>
                            <h3 className="text-xl font-semibold text-foreground mt-6">Palavras Reservadas pelo Sistema</h3>
                            <ul>
                                <li><strong>`[PROTOCOLO]`</strong>: É substituída pelo número de protocolo único do incidente (ex: HERMES-A1B2C3D4). Ideal para ser usada no corpo e assunto de templates e lembretes.</li>
                                <li><strong>`[ASSUNTO]`</strong>: É substituída pelo assunto da notificação original. Disponível **apenas** no campo "Assunto do Lembrete" na criação de uma Categoria de SLA.</li>
                            </ul>
                            <h3 className="text-xl font-semibold text-foreground mt-6">Como Inserir e Referenciar Imagens</h3>
                            <p>
                                O método principal para adicionar imagens é **copiar e colar** diretamente no editor de texto no Passo 2 do envio. O sistema faz o upload e incorpora a imagem ao e-mail, garantindo que ela seja exibida corretamente para o destinatário.
                            </p>
                            <p>
                                Adicionalmente, você pode usar a sintaxe `[IMAGEM: descrição da imagem]` diretamente no corpo do template. O sistema **não substituirá** este texto por um campo de upload; ele serve apenas como um **lembrete textual** no corpo do e-mail para o analista, indicando que uma imagem deve ser colada naquele local durante a fase de edição.
                            </p>
                        </DocSection>

                        <DocSection title="Guia do Administrador" id="guia-admin">
                            <h3 className="text-xl font-semibold text-foreground">Gerenciando Usuários e Perfis</h3>
                            <p>
                                Em <Link href="/admin/profiles" className="text-primary hover:underline">Gerenciar Perfis</Link>, você cria "cargos" com permissões específicas. Em <Link href="/admin/users" className="text-primary hover:underline">Gerenciar Usuários</Link>, você cria os usuários e atribui a eles um perfil, controlando o que cada um pode fazer.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Gerenciando Templates e Categorias de SLA</h3>
                            <p>
                                Em <Link href="/admin/templates" className="text-primary hover:underline">Gerenciar Templates</Link>, você cria os modelos de e-mail. Utilize as variáveis (ex: `[*Assunto]`) para criar campos dinâmicos que serão preenchidos no momento do envio.
                            </p>
                            <p>
                                As <strong>Categorias de SLA</strong> (<Link href="/admin/categories" className="text-primary hover:underline">Gerenciar Categorias</Link>) são o cérebro por trás dos lembretes automáticos. Ao criar uma categoria, você define:
                            </p>
                            <ul>
                                <li><strong>Modo de Lembrete:</strong> Se os lembretes serão enviados em intervalos de horas (ex: a cada 24h) ou em um horário específico todos os dias (ex: às 09:00).</li>
                                <li><strong>Corpo e Assunto do Lembrete:</strong> Você define o conteúdo que será enviado nos e-mails de lembrete. Utilize a palavra reservada `[PROTOCOLO]` no corpo do lembrete e `[ASSUNTO]` no assunto para referenciar dados do incidente original.</li>
                            </ul>
                            <p>Depois de criar uma categoria, você a associa a um ou mais templates. Todos os incidentes criados a partir desses templates herdarão as regras de lembrete da categoria.</p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Configurando Contas de E-mail</h3>
                            <p>
                                A tela de <Link href="/admin/email-accounts" className="text-primary hover:underline">Contas de E-mail</Link> é onde você cadastra as contas SMTP para **enviar** as notificações.
                            </p>
                            <p>
                                A configuração da conta IMAP, para **ler e detectar respostas**, é feita na tela de <Link href="/admin/company" className="text-primary hover:underline">Gerenciar Empresa</Link>. É fundamental que esta conta seja configurada corretamente para que o fluxo de respostas funcione. Lembre-se de usar o botão "Testar Conexão" para validar as credenciais SMTP e IMAP.
                            </p>
                        </DocSection>

                        <DocSection title="Perfis de Permissão" id="perfis-permissoes">
                            <p>
                                Os perfis são a base para o controle de acesso no Hermes Hub. Eles permitem agrupar um conjunto de permissões e atribuí-lo a múltiplos usuários, facilitando a gestão de o que cada membro da equipe pode fazer.
                            </p>
                            <h3 className="text-xl font-semibold text-foreground mt-6">Permissões Disponíveis</h3>
                            <p>
                                Ao criar ou editar um perfil em <Link href="/admin/profiles" className="text-primary hover:underline">Gerenciar Perfis</Link>, você pode conceder as seguintes permissões:
                            </p>
                            <ul>
                                <li><strong>Gerenciar Usuários:</strong> Permite criar, editar e excluir usuários no sistema.</li>
                                <li><strong>Gerenciar Perfis:</strong> Permite criar, editar e excluir perfis de permissão.</li>
                                <li><strong>Gerenciar Templates:</strong> Concede acesso total à criação e edição de templates de e-mail e categorias de SLA.</li>
                                <li><strong>Enviar Notificações:</strong> Permissão fundamental que permite ao usuário acessar a tela de envio e submeter notificações.</li>
                                <li><strong>Aprovar Notificações:</strong> Concede o poder de aprovar ou rejeitar notificações que foram submetidas por outros usuários. Esta é a chave para o fluxo de autoaprovação.</li>
                            </ul>
                        </DocSection>

                        <DocSection title="Clientes" id="clientes">
                            <p>
                                A seção de <Link href="/admin/clientes" className="text-primary hover:underline">Gerenciar Clientes</Link> funciona como uma agenda de contatos centralizada. O objetivo é agrupar múltiplos endereços de e-mail sob um único nome, simplificando o processo de envio.
                            </p>
                            <ul>
                                <li><strong>Agrupamento:</strong> Em vez de digitar vários e-mails toda vez, você pode simplesmente selecionar "Cliente X", e o sistema enviará a notificação para todos os e-mails cadastrados para ele.</li>
                                <li><strong>Formato dos E-mails:</strong> Ao cadastrar e-mails para um cliente, você pode inseri-los separados por vírgula, ponto e vírgula ou um por linha.</li>
                            </ul>
                        </DocSection>

                        {/* 2. NOVA SEÇÃO PARA A PÁGINA "GERENCIAR EMPRESA" */}
                        <DocSection title="Configurações da Empresa e Marca" id="config-empresa">
                            <p>
                                A tela de <Link href="/admin/company" className="text-primary hover:underline">Gerenciar Empresa</Link> é onde você personaliza a identidade visual e configura os canais de comunicação centrais do Hermes Hub.
                            </p>
                            <ul>
                                <li><strong>Logótipo da Empresa:</strong> O logo enviado aqui é utilizado em locais chave para reforçar a identidade da sua marca:
                                    <ul>
                                        <li>No cabeçalho da barra de navegação superior, ao lado do botão de sair.</li>
                                        <li>Como cabeçalho principal em todos os relatórios exportados em PDF.</li>
                                        <li>Opcionalmente, como uma marca d'água sutil no fundo das páginas dos relatórios em PDF.</li>
                                    </ul>
                                </li>
                                <li><strong>E-mails em Cópia (CC):</strong> Permite definir uma lista de e-mails que receberão cópia de todas as notificações iniciais enviadas pela plataforma, ideal para gestores ou para fins de arquivamento.</li>
                                <li><strong>Customização de PDF:</strong> Configure um título e texto de rodapé padrão para todos os relatórios em PDF, além de poder habilitar ou desabilitar a marca d'água.</li>
                                <li><strong>Configurações IMAP (Leitura de Respostas):</strong> Esta é uma das configurações mais importantes. Você deve configurar uma conta de e-mail que receberá as respostas dos clientes. O Hermes Hub monitora esta caixa de entrada para detectar respostas automaticamente, pausar o incidente e notificar o analista responsável.</li>
                            </ul>
                        </DocSection>

                        <DocSection title="Aprovações e Autoaprovação" id="aprovacoes">
                            <p>
                                O fluxo de aprovação é um mecanismo de segurança e qualidade que garante que as comunicações sejam revisadas antes do envio. O funcionamento é determinado pela permissão <strong>"Aprovar Notificações"</strong> de um usuário.
                            </p>
                            <h3 className="text-xl font-semibold text-foreground mt-6">Fluxo Padrão (Sem Permissão de Aprovar)</h3>
                            <ol>
                                <li>O usuário preenche todos os dados e submete a notificação.</li>
                                <li>A notificação é salva no sistema com o status <strong>PENDENTE</strong>.</li>
                                <li>Um e-mail é enviado para todos os usuários que possuem a permissão de aprovar, alertando sobre a nova pendência.</li>
                                <li>A notificação aparece na tela de <Link href="/approvals" className="text-primary hover:underline">Aprovações</Link>, aguardando a ação de um aprovador.</li>
                            </ol>
                            <h3 className="text-xl font-semibold text-foreground mt-6">Fluxo de Autoaprovação</h3>
                            <p>
                                Quando um usuário possui a permissão <strong>"Aprovar Notificações"</strong> em seu perfil, o fluxo muda:
                            </p>
                            <ol>
                                <li>O usuário preenche todos os dados e submete a notificação.</li>
                                <li>O sistema verifica que o usuário tem permissão para aprovar.</li>
                                <li>A notificação é automaticamente aprovada e enviada aos destinatários, recebendo o status <strong>SENT</strong> (Enviado) imediatamente.</li>
                                <li>A notificação não passa pela tela de aprovações.</li>
                            </ol>
                        </DocSection>

                        <DocSection title="Recursos Adicionais" id="recursos-adicionais">
                            <h3 className="text-xl font-semibold text-foreground">Analisando o Dashboard</h3>
                            <p>O <Link href="/dashboard" className="text-primary hover:underline">Dashboard</Link> oferece uma visão geral e em tempo real da operação. Os gráficos disponíveis são:</p>
                            <ul>
                                <li><strong>Incidentes Abertos por Analista:</strong> Mostra quais analistas possuem mais incidentes ativos sob sua responsabilidade.</li>
                                <li><strong>Notificações por Categoria:</strong> Agrupa os envios por categoria de SLA, ajudando a identificar os tipos de incidentes mais comuns.</li>
                                <li><strong>Top 5 Rankings:</strong> Mostram os templates mais usados, os clientes mais notificados e os analistas com mais submissões, permitindo identificar padrões de uso.</li>
                                {/* 3. ADICIONADA EXPLICAÇÃO DO NOVO GRÁFICO */}
                                <li><strong>Tempo Médio de Resposta por Cliente:</strong> Exibe o tempo médio (em horas) que cada cliente leva para responder a uma notificação. Este gráfico é um excelente indicador de SLA e ajuda a visualizar quais clientes são mais responsivos.</li>
                            </ul>
                            <h3 className="text-xl font-semibold text-foreground mt-6">Consultando Logs e Relatórios</h3>
                            {/* 4. ADICIONADO EXPORTAÇÃO JSON */}
                            <p>O Hermes Hub possui duas telas de log para auditoria e consulta, ambas com filtros avançados e opção de exportar para CSV, PDF ou JSON.</p>
                            <ul>
                                <li><strong>Log de Notificações:</strong> Registra cada notificação, ideal para consultar o histórico de comunicação com um cliente.</li>
                                <li><strong>Eventos do Sistema (Auditoria):</strong> Grava cada ação importante realizada na plataforma (criação de usuário, alteração de perfil, etc.), uma ferramenta essencial para a segurança.</li>
                            </ul>
                            <h3 className="text-xl font-semibold text-foreground mt-6">Regras de Exclusão</h3>
                            <p>Para manter a integridade histórica, o sistema impede a exclusão de registros que estão conectados a outros (ex: um perfil em uso por um usuário não pode ser excluído).</p>
                            <h3 className="text-xl font-semibold text-foreground mt-6">Funcionamento do Sino de Notificações</h3>
                            <p>O sino de notificações na barra superior é seu assistente pessoal para respostas:</p>
                            <ul>
                                <li><strong>Personalizado:</strong> Ele só exibirá notificações de respostas para os incidentes que **você** enviou.</li>
                                <li><strong>Indicador Visual:</strong> O ponto azul pulsante só aparece se houver respostas **não lidas**.</li>
                                <li><strong>Marcação de Leitura:</strong> Ao clicar para abrir o menu do sino, todas as notificações visíveis são automaticamente marcadas como lidas, e o ponto azul desaparece.</li>
                            </ul>
                        </DocSection>

                        <DocSection title="Gmail: Configurando Envio (SMTP) e Respostas (IMAP)" id="config-gmail">
                            <p>
                                Para que o Hermes Hub consiga tanto enviar e-mails quanto detectar respostas, é crucial configurar corretamente o acesso a contas de e-mail dedicadas. A seguir, detalhamos o processo para o Gmail, que exige o uso de "Senhas de App" por segurança.
                            </p>
                            <h3 className="text-xl font-semibold text-foreground mt-6">Pré-requisito: Ativar a Verificação em Duas Etapas</h3>
                            <p>
                                O Google só permite a criação de Senhas de App para contas com a Verificação em Duas Etapas ativada. Se ainda não a ativou, siga o guia oficial do Google antes de continuar: <a href="https://support.google.com/accounts/answer/185839" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ativar a Verificação em Duas Etapas</a>.
                            </p>
                            <h3 className="text-xl font-semibold text-foreground mt-6">Passo 1: Criar uma Senha de App no Google</h3>
                            <p>
                                Você não deve usar a sua senha principal do Gmail no Hermes Hub. Em vez disso, crie uma senha específica para a aplicação:
                            </p>
                            <ol>
                                <li>Acesse a página de segurança da sua Conta Google: <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">myaccount.google.com/security</a>.</li>
                                <li>Na seção "Como você faz login no Google", clique em <strong>Senhas de app</strong>. Pode ser necessário fazer login novamente.</li>
                                <li>Na parte inferior, clique em <strong>Selecione o app</strong> e escolha <strong>Outro (nome personalizado)</strong>.</li>
                                <li>Digite um nome para a senha (por exemplo, "Hermes Hub Envio SMTP" ou "Hermes Hub Leitura IMAP") e clique em <strong>Gerar</strong>.</li>
                                <li>O Google irá gerar uma senha de 16 caracteres em um fundo amarelo. <strong>Copie esta senha</strong>. Este é o único momento em que ela será exibida.</li>
                                <li>Guarde esta senha em um local seguro, pois você a usará na configuração do Hermes Hub.</li>
                            </ol>
                            <p>
                                Para mais detalhes, consulte a <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">documentação oficial do Google sobre Senhas de App</a>.
                            </p>
                            <h3 className="text-xl font-semibold text-foreground mt-6">Passo 2: Configurar a Conta de Envio (SMTP)</h3>
                            <p>
                                Com a Senha de App em mãos, vá para <Link href="/admin/email-accounts" className="text-primary hover:underline">Administração &gt; Gerenciar Contas de E-mail</Link> no Hermes Hub e crie ou edite uma conta com os seguintes dados:
                            </p>
                            <ul>
                                <li><strong>Host SMTP:</strong> `smtp.gmail.com`</li>
                                <li><strong>Porta SMTP:</strong> `587`</li>
                                <li><strong>Usuário SMTP:</strong> Seu endereço de e-mail completo do Gmail (ex: `envios-hermes@gmail.com`).</li>
                                <li><strong>Senha SMTP:</strong> Cole a <strong>Senha de App de 16 caracteres</strong> que você gerou.</li>
                                <li><strong>Usar conexão segura (SSL/TLS):</strong> Marque esta opção.</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Passo 3: Configurar a Conta de Leitura de Respostas (IMAP)</h3>
                            <p>
                                É uma boa prática usar uma conta de e-mail separada para receber as respostas. Gere uma <strong>nova Senha de App</strong> para esta conta e configure-a em <Link href="/admin/company" className="text-primary hover:underline">Administração &gt; Gerenciar Empresa</Link>:
                            </p>
                            <ul>
                                <li><strong>Host IMAP:</strong> `imap.gmail.com`</li>
                                <li><strong>Porta IMAP:</strong> `993`</li>
                                <li><strong>Usuário (E-mail):</strong> O endereço de e-mail da conta de respostas (ex: `respostas-hermes@gmail.com`).</li>
                                <li><strong>Senha:</strong> Cole a <strong>nova Senha de App de 16 caracteres</strong> gerada para esta conta.</li>
                                <li><strong>Usar conexão segura (TLS):</strong> Marque esta opção.</li>
                            </ul>
                            <p>
                                Após preencher os campos, clique no botão <strong>Testar Conexão</strong> em ambas as telas para garantir que o Hermes Hub consegue se comunicar com os serviços do Google.
                            </p>

                            <div className="mt-6 p-4 border-l-4 border-yellow-500 bg-yellow-500/10">
                                <p className="font-semibold text-yellow-400">Observação Importante sobre a Primeira Conexão</p>
                                <p className="text-sm mt-2">
                                    Em alguns casos, ao configurar uma conta do Gmail pela primeira vez, a conexão de teste com a opção "Usar conexão segura" ativada pode falhar. Se isso acontecer, tente o seguinte:
                                </p>
                                <ol className="list-decimal list-inside text-sm mt-2 space-y-1">
                                    <li>Desmarque a opção "Usar conexão segura (SSL/TLS)".</li>
                                    <li>Clique em "Testar Conexão". A conexão pode falhar, mas esta etapa é importante.</li>
                                    <li>Verifique o e-mail da conta que você está configurando. O Google pode ter enviado um alerta de segurança sobre uma "tentativa de login de aplicativo menos seguro". Siga as instruções no e-mail para permitir o acesso.</li>
                                    <li>Volte ao Hermes Hub, <strong>marque novamente</strong> a opção "Usar conexão segura (SSL/TLS)" e teste a conexão mais uma vez. Geralmente, ela funcionará após esses passos.</li>
                                </ol>
                            </div>
                        </DocSection>


                    </div>
                </div>
                <div className="hidden lg:block">
                    <DocNav sections={sections} />
                </div>
            </div>
        </DashboardLayout>
    );
}

export default withAuth(ManualPage);