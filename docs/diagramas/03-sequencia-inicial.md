# Diagrama de Sequência — Aceite de doação (versão inicial)

> Versão inicial gerada com IA a partir apenas da descrição de alto nível do fluxo,
> sem consulta ao código. Preservada sem correções para a análise crítica.

**Descrição usada:** a ONG pede para aceitar uma doação, a aplicação registra a
reserva e responde com sucesso ou falha.

```mermaid
sequenceDiagram
    autonumber
    actor ONG
    participant API as Aplicação (API)
    participant Servico as Serviço de Doações
    participant BD as Banco de Dados

    ONG->>API: Solicita aceite da doação (id, dados da ONG)
    API->>Servico: aceitarDoacao(id, ong)
    Servico->>BD: Buscar doação por id
    BD-->>Servico: Dados da doação (status)

    alt Doação disponível
        Servico->>BD: Atualizar status para "reservada" e vincular ONG
        BD-->>Servico: Confirmação da atualização
        Servico-->>API: Reserva registrada
        API-->>ONG: Sucesso — doação reservada para a ONG
    else Doação inexistente ou indisponível
        Servico-->>API: Erro (doação não pode ser aceita)
        API-->>ONG: Falha — aceite recusado
    end
```

## Explicação breve

1. A ONG envia à API o pedido de aceite de uma doação.
2. A API repassa o pedido para a camada de serviço, que concentra a regra de negócio.
3. O serviço consulta a doação no banco para conferir se ela ainda está disponível.
4. Se estiver disponível, o serviço muda a doação para reservada, registra a ONG
   responsável e a API responde com sucesso.
5. Se a doação não existir ou já tiver sido aceita, a API responde com falha.
