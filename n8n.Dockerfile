# Etapa 1: Construir el buscador de emails en Go
FROM golang:1.23-alpine AS builder
RUN apk add --no-cache git
RUN go install github.com/rix4uni/emailfinder@latest

# Etapa 2: Imagen final de n8n
FROM n8nio/n8n:latest

USER root
# Copiar el buscador OSINT
COPY --from=builder /go/bin/emailfinder /usr/local/bin/emailfinder

# Asegurar permisos (n8n usa el usuario node)
RUN chown node:node /usr/local/bin/emailfinder

USER node
# No ponemos CMD ni EXPOSE para que use los originales de n8n que ya funcionan