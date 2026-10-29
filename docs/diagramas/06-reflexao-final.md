# Reflexão Final — Diagramas do Prato Cheio

O diagrama de estados foi o mais útil para compreender e questionar uma decisão do projeto Prato Cheio, pois mostra as mudanças de estado de uma doação desde o cadastro até a coleta.

A análise permitiu observar que, quando uma reserva expira, a doação só deve voltar ao estado disponível se o alimento ainda estiver dentro da validade. Também ficou evidente que a verificação da expiração ocorre sob demanda, durante operações do sistema, e não necessariamente por uma rotina automática em segundo plano.

Esse diagrama ajuda a comparar as regras de negócio com o comportamento implementado e a identificar possíveis inconsistências entre o modelo e o código.
