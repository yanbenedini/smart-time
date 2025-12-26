# Usa uma imagem leve do Node.js
FROM node:20-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do projeto
COPY . .

# Expõe a porta padrão do Vite
EXPOSE 5173

# Roda o servidor de desenvolvimento, forçando o host para aceitar conexões externas (Docker)
CMD ["npm", "run", "dev", "--", "--host"]