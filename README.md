# 📡 Hermes Hub

> **Plataforma centralizada para notificação e gerenciamento de incidentes.**

O **Hermes Hub** foi desenvolvido para simplificar e automatizar o processo de comunicação de incidentes.  
Com ele, administradores podem criar templates de e-mail, gerenciar listas de clientes e enviar notificações de forma rápida, padronizada e segura — sempre com um **fluxo de aprovação integrado**.

---

## 🚀 Principais Recursos

- **Envio Padronizado:** Utilize templates pré-aprovados para garantir consistência e agilidade.  
- **Fluxo de Aprovação:** Submissão de notificações para aprovação, evitando falhas de comunicação.  
- **Gerenciamento de Incidentes:** Acompanhe todo o ciclo de vida — abertura, pausa, resposta e fechamento.  
- **Detecção Automática de Respostas:** Monitora a caixa de entrada IMAP e pausa incidentes quando há retorno do cliente.  
- **Administração Completa:** Controle usuários, perfis, clientes, templates, categorias de SLA e contas de e-mail em um só lugar.  
- **Relatórios em PDF:** Extraia dados consolidados (ranking de clientes, categorias, tempo médio de resposta etc.).  
- **MFA (Autenticação de Dois Fatores):** Segurança reforçada para logins administrativos.  

---

## 📊 Ciclo de Vida do Incidente

- **Aberto (🟨):** Notificação enviada, aguardando resposta ou lembrete automático.  
- **Pausado (🟦):** Incidente interrompido manualmente ou por resposta automática do cliente.  
- **Respondido (🟪):** Indica que houve resposta do cliente (sempre em conjunto com "Pausado").  
- **Fechado (🟩):** Incidente concluído, sem novos lembretes.  

---

## 📑 Relatórios Disponíveis

- **Categorias por Cliente:** Detalha incidentes por tipo de SLA.  
- **Top Clientes Notificados:** Ranking de clientes que mais receberam notificações.  
- **Tempo Médio de Resposta:** Mede a agilidade de cada cliente em responder notificações.  

---

## 🛠️ Configuração de E-mail

O Hermes Hub depende de contas **SMTP** (envio) e **IMAP** (respostas) para funcionar corretamente.

### Exemplo com Gmail
- **SMTP:**  
  - Host: `smtp.gmail.com`  
  - Porta: `587`  
  - Autenticação com senha de app  

- **IMAP:**  
  - Host: `imap.gmail.com`  
  - Porta: `993`  
  - Autenticação com senha de app  

> ⚠️ Importante: o uso de **Senhas de App** no Gmail é obrigatório.  

---

## 🔐 Segurança

- **Perfis de Permissão:** controle granular de acessos (usuários, templates, aprovações).  
- **MFA (2FA):** autenticação obrigatória com aplicativo autenticador (Google Authenticator, Authy etc.).  
- **Logs de Auditoria:** registro de todas as ações relevantes para rastreabilidade e conformidade.  

---

## 👨‍💻 Autoria

- Kalvin Albuquerque - Desenvolvedor Full-Stack
- Natan Santos - Engenheiro de Software
- Tainá Sacramento - Arquiteta de Soluções

© 2025 Hermes Hub | Todos os direitos reservados.
