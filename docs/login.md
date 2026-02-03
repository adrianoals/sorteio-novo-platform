# Login Admin + Guia do dia a dia

## Credenciais

- **Email:** admin@sorteionovo.local
- **Senha:** admin123

---

## Encerrar hoje (para continuar amanhã)

1. **Parar o servidor Next.js**  
   No terminal onde está rodando `npm run dev`, pressione **Ctrl+C**.

2. **Parar o Docker (Postgres)**  
   Na raiz do projeto (`sorteioNovo-V2`):
   ```bash
   docker-compose down
   ```
   O container do Postgres para e é removido. Os dados ficam no volume; ao subir de novo, eles continuam lá.

Pronto. Pode fechar o computador.

---

## Rodar amanhã (passo a passo)

1. **Entrar na pasta do projeto**
   ```bash
   cd /Users/adriano/Desktop/Sorteio\ Novo/sorteioNovo-V2
   ```

2. **Subir o Postgres**
   ```bash
   docker-compose up -d
   ```

3. **Subir a aplicação**
   ```bash
   npm run dev
   ```

4. **Abrir no navegador**  
   [http://localhost:3000](http://localhost:3000)  
   Para o admin: [http://localhost:3000/admin](http://localhost:3000/admin) (redireciona para o login se não estiver logado).

5. **Fazer login**  
   Use o email e a senha acima na tela de login.

---

## Resumo rápido

| Quando        | O que fazer |
|---------------|-------------|
| **Encerrar**  | Ctrl+C no terminal do `npm run dev` → `docker-compose down` |
| **Voltar**    | `docker-compose up -d` → `npm run dev` → abrir localhost:3000 |

Documentação completa do projeto: `docs/desenvolvimento-local.md`.
