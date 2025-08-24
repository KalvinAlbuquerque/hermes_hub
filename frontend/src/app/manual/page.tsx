// Arquivo: frontend/src/app/manual/page.tsx
"use client";

import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import DocSection from "@/components/DocSection";
import DocNav from "@/components/DocNav"; // Importar o novo componente de navegação
import Link from "next/link";

// Definir as seções para o menu de navegação
const sections = [
  { id: "visao-geral", title: "Visão Geral" },
  { id: "guia-usuario", title: "Guia do Usuário" },
  { id: "variaveis", title: "Variáveis e Palavras Reservadas" },
  { id: "guia-admin", title: "Guia do Administrador" },
  { id: "recursos-adicionais", title: "Recursos Adicionais" },
];

function ManualPage() {
  return (
    <DashboardLayout>
      {/* Layout de duas colunas para o conteúdo e a navegação */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        
        {/* Coluna principal do conteúdo */}
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
                O envio de notificações é o coração do sistema. O processo é dividido em 3 passos para garantir precisão e flexibilidade.
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
              
              <h3 className="text-xl font-semibold text-foreground mt-6">Gerenciando Incidentes</h3>
              <p>
                A tela de <Link href="/incidents" className="text-primary hover:underline">Gerenciar Incidentes</Link> é onde você acompanha o ciclo de vida de cada notificação enviada. Os status indicam a situação atual:
              </p>
              <ul>
                <li><strong>Aberto (Amarelo):</strong> O incidente foi criado e a notificação enviada. O sistema está aguardando uma resposta ou o envio de lembretes automáticos.</li>
                <li><strong>Pausado (Azul):</strong> O ciclo de lembretes foi interrompido, seja por uma resposta detectada ou por ação manual.</li>
                <li><strong>Respondido (Roxo):</strong> Uma tag visual que indica que o sistema detectou uma resposta do destinatário.</li>
                <li><strong>Fechado (Verde):</strong> O incidente foi resolvido e finalizado pelo analista.</li>
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
                    O método principal para adicionar imagens é **copiar e colar** diretamente no editor de texto no Passo 2 do envio. O sistema faz o upload e incorpora a imagem ao e-mail.
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
              <h3 className="text-xl font-semibold text-foreground mt-6">Gerenciando Templates e Categorias</h3>
              <p>
                Em <Link href="/admin/templates" className="text-primary hover:underline">Gerenciar Templates</Link>, você cria os modelos de e-mail. Utilize as variáveis (ex: `[*Assunto]`) para criar campos dinâmicos.
              </p>
              <p>
                Em <Link href="/admin/categories" className="text-primary hover:underline">Gerenciar Categorias</Link>, você define regras de SLA (ex: enviar lembrete a cada 24h). Utilize a palavra reservada `[PROTOCOLO]` no corpo do lembrete e `[ASSUNTO]` no assunto.
              </p>
              <h3 className="text-xl font-semibold text-foreground mt-6">Configurando Contas de E-mail</h3>
              <p>
                A tela de <Link href="/admin/email-accounts" className="text-primary hover:underline">Contas de E-mail</Link> é onde você cadastra as contas SMTP para **enviar** as notificações.
              </p>
              <p>
                A configuração da conta IMAP, para **ler e detectar respostas**, é feita na tela de <Link href="/admin/company" className="text-primary hover:underline">Gerenciar Empresa</Link>. Lembre-se de usar o botão "Testar Conexão".
              </p>
            </DocSection>
            
            <DocSection title="Recursos Adicionais" id="recursos-adicionais">
                <h3 className="text-xl font-semibold text-foreground">Analisando o Dashboard</h3>
                <p>O <Link href="/dashboard" className="text-primary hover:underline">Dashboard</Link> oferece uma visão geral e em tempo real da operação. Os gráficos disponíveis são:</p>
                <ul>
                    <li><strong>Incidentes Abertos por Analista:</strong> Mostra quais analistas possuem mais incidentes ativos sob sua responsabilidade.</li>
                    <li><strong>Notificações por Categoria:</strong> Agrupa os envios por categoria de SLA, ajudando a identificar os tipos de incidentes mais comuns.</li>
                    <li><strong>Top 5 Rankings:</strong> Mostram os templates mais usados, os clientes mais notificados e os analistas com mais submissões, permitindo identificar padrões de uso.</li>
                </ul>
                <h3 className="text-xl font-semibold text-foreground mt-6">Consultando Logs e Relatórios</h3>
                <p>O Hermes Hub possui duas telas de log para auditoria e consulta, ambas com filtros avançados e opção de exportar para CSV ou PDF.</p>
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
          </div>
        </div>

        {/* Coluna da Navegação Rápida */}
        <div className="hidden lg:block">
          <DocNav sections={sections} />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ManualPage);