# Usa uma imagem leve do Node.js
FROM node:20-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia todo o código fonte da pasta server
COPY . .

# Compila o TypeScript para JavaScript (gera a pasta dist)
RUN npm run build

# Expõe a porta que a API usa
EXPOSE 5000

# Comando para iniciar a aplicação (definido no package.json como "node dist/index.js")
CMD ["npm", "start"]