# VentiCIP

App de ferramentas de apoio à ventilação mecânica na UCIP, para iOS e
Android (Expo / React Native). Tem um menu inicial com acesso a quatro
páginas: a **Calculadora de Pressão Transpulmonar** (balão esofágico,
sonda Nutrivent™), os **Limites de Ventilação Mecânica** (volume corrente
e volume minuto), a **Mechanical Power** (energia mecânica transferida ao
pulmão) e uma página de **Referências** com as fórmulas e esquemas usados
nos cálculos.

Portada a partir das folhas de cálculo `Balão Esofágico.xlsx` e `Balão
Esofágico (com valores alvo).xlsx` usadas na UCIP, e da fórmula de peso
ideal já usada no projeto irmão NutriCIP. Toda a lógica de cálculo foi
validada, valor a valor, contra essas fontes — ver `src/calc/validate.ts`
e `src/calc/validateTidalVolume.ts`.

> ⚠️ **Aviso importante:** esta aplicação é uma ferramenta de apoio ao
> cálculo, destinada a profissionais de saúde. Não substitui o julgamento
> clínico, não é um dispositivo médico certificado, e os valores devem ser
> sempre confirmados antes de qualquer ajuste ventilatório real. Antes de
> submeter esta app a lojas públicas (App Store / Google Play), confirma
> com o serviço de compliance/jurídico da tua instituição se é necessário
> algum enquadramento regulatório adicional (ex: Regulamento de
> Dispositivos Médicos da UE), dado que a app apoia decisões de
> ventilação mecânica em doentes reais.

## O que já está feito

- **Menu inicial** com acesso às 4 páginas da app.
- **Calculadora de Pressão Transpulmonar**:
  - Cada um dos 4 valores medidos (**PEEP**, **Pplat**, **PEsee**,
    **PEsei**) tem o seu **próprio seletor de unidade** (cmH2O ou mmHg) —
    podes, por exemplo, introduzir a PEEP em cmH2O e a Pplat em mmHg no
    mesmo cálculo. Um valor em mmHg é convertido automaticamente para
    cmH2O (fator ×1,36, igual ao usado na folha original) antes de
    qualquer cálculo; quando pelo menos um campo está em mmHg, os 4
    valores convertidos são mostrados para conferência.
  - Cálculo de:
    - **PL expiratória (PLee)** = PEEP − PEsee — alvo 0 a 5 cmH2O. Tem
      3 estados visuais: **verde** dentro do alvo, **amarelo** em risco
      de atelectrauma (`<0`), **vermelho** em risco de barotrauma (`>5`);
    - **PL inspiratória (PLei)** = Pplat − PEsei — alvo `<20` cmH2O
      (verde dentro do alvo, amarelo acima do alvo, **cinzento "Rever
      valores"** se o resultado for negativo — sem sentido clínico,
      provável erro nos valores introduzidos);
    - **Driving PL (DPl)** = (Pplat − PEEP) − (PEsei − PEsee) — alvo
      `<12` cmH2O, com os mesmos 3 estados que a PLei;
    - **Driving Pressure convencional** = Pplat − PEEP — a medida
      "clássica" (não transpulmonar), mostrada sempre como referência.
  - **Sugestão de atuação**: quando algum parâmetro está fora do alvo,
    aparece um cartão com a sugestão correspondente — aumentar a PEEP
    (atelectrauma), reduzir a PEEP (barotrauma), ou rever volume
    corrente/frequência ventilatória/relação I:E (PLei ou DPl acima do
    alvo).
- **Limites de Ventilação Mecânica** (Volume Corrente / Volume Minuto):
  - Peso, altura e sexo do doente; o sexo é necessário para a fórmula do
    peso ideal.
  - **Régua deslizante** (componente próprio, sem dependências externas)
    para definir a frequência respiratória (FR) inicial.
  - Calcula o IMC e decide automaticamente se usa o peso real (IMC
    normal, 18,5–24,9) ou o peso ideal — fórmula de Devine, igual à do
    NutriCIP (IMC alterado).
  - **Vc (volume corrente)** = 6 a 8 mL × peso usado.
  - **VM (volume minuto)** = Vc × FR.
- **Mechanical Power** (fórmula simplificada, ventilação controlada a
  volume):
  - Todos os 5 parâmetros — **RR** (frequência respiratória), **Vc**
    (volume corrente, em mL), **Ppico** (pressão de pico), **Pplat**
    (pressão de plateau) e **PEEP** — usam **réguas deslizantes** (o mesmo
    componente `RulerSlider` usado nos Limites de Ventilação Mecânica),
    em vez de campos de texto. O resultado é **recalculado em tempo
    real** a cada movimento de qualquer régua. Pressões sempre em cmH2O
    (os ventiladores mostram-nas diretamente nesta unidade, por isso não
    há seletor de unidade aqui).
  - Mostra a **Driving Pressure convencional** (Pplat − PEEP) como
    referência, e a **Mechanical Power (MP)** em J/min, com 2 estados:
    **verde** (`≤17` J/min) e **vermelho** (`>17` J/min — referência
    citada por Serpa Neto et al., 2018, associada a maior risco).
  - **Sugestão de atuação** quando a MP está acima do valor de
    referência: rever volume corrente, PEEP, driving pressure e
    frequência respiratória.
- **Referências**: as fórmulas de todos os cálculos acima, mais os
  esquemas/tabelas extraídos do protocolo da UCIP e da literatura citada
  (métodos de cálculo da PL, limites sugeridos, e exemplos de titulação
  de PEEP pela pressão transpulmonar).
- Motores de cálculo isolados da interface
  (`src/calc/transpulmonaryCalculator.ts`,
  `src/calc/tidalVolumeCalculator.ts`, `src/calc/mechanicalPowerCalculator.ts`),
  para serem fáceis de testar e de reutilizar.

## Lógica clínica implementada

### Pressão transpulmonar — fórmulas

```
PLee (PL expiratória)          = PEEP  − PEsee
PLei (PL inspiratória)         = Pplat − PEsei
DPl  (Driving PL)              = (Pplat − PEEP) − (PEsei − PEsee)
Driving Pressure convencional  = Pplat − PEEP
```

onde `PEEP` e `Pplat` são as pressões das vias aéreas no fim da expiração
e no fim da inspiração (plateau), respetivamente, e `PEsee`/`PEsei` são as
pressões esofágicas correspondentes. Conversão: **1 mmHg = 1,36 cmH2O**.

### Pressão transpulmonar — alvos clínicos

Seguindo o protocolo da UCIP (reanálise post-hoc do EPVent2):

| Parâmetro       | Alvo                                              |
|-----------------|----------------------------------------------------|
| PL expiratória  | 0 a 5 cmH2O (`<0` atelectrauma; `>5` barotrauma)   |
| PL inspiratória | `<20` cmH2O                                        |
| Driving PL      | `<12` cmH2O                                        |

> Nota: a literatura tem também uma referência ligeiramente diferente
> para a PL expiratória (±2 cmH2O, Dostal & Dostalova 2023) — optámos por
> seguir os valores da folha de cálculo/protocolo da UCIP (0 a 5 cmH2O),
> por decisão da equipa clínica. Ver a página de Referências na app.

### Volume corrente / volume minuto — fórmulas e regra

```
IMC          = peso (kg) / altura (m)²
Peso ideal   = 50 + 0,91×(altura_cm−152,4)      [homem]
             = 45,5 + 0,91×(altura_cm−152,4)    [mulher]
Peso usado   = peso real (se IMC 18,5–24,9) ou peso ideal (caso contrário)
Vc           = 6 a 8 mL × peso usado
VM           = Vc × FR
```

### Mechanical Power — fórmula e alvo

```
MP = 0,098 × RR × Vc × [Ppico − 1/2×(Pplat − PEEP)]
```

onde `RR` é a frequência respiratória (ciclos/min), `Vc` o volume
corrente em **litros** (a régua na app está em mL, convertido internamente),
e as pressões em cmH2O. Resultado em J/min. Fórmula original: Gattinoni
L, et al. *Mechanical power and development of ventilator-induced lung
injury*. Anesthesiology. 2016. Alvo de referência usado na app:

| Parâmetro         | Alvo         |
|--------------------|-------------|
| Mechanical Power   | `≤17` J/min |

Limite citado por Serpa Neto A, et al. *Mechanical power of ventilation
is associated with mortality in critically ill patients*. Intensive Care
Med. 2018 — associado a maior risco de lesão pulmonar/mortalidade acima
deste valor.

## Como correr o projeto

```bash
npm install
npx expo start
```

Depois abre a app no telemóvel com a app **Expo Go** (Android/iOS) a ler o
QR code, ou corre num simulador com `npm run ios` / `npm run android`.

### Se o telemóvel e o computador não estiverem na mesma rede local

O modo por defeito (LAN) só funciona se o telemóvel e o computador
conseguirem ver-se diretamente na mesma rede local. Se um dos dois (ou os
dois) estiver em dados móveis, atrás de VPN, ou numa rede com "isolamento
de clientes" (comum em redes de trabalho e hotspots), vais ver erros como
`Failed to download remote update` no Expo Go. A solução é usar o modo
túnel, que passa pela internet em vez de depender da rede local:

```bash
npx expo start --tunnel
```

O `@expo/ngrok` (necessário para o túnel) já está no `package.json` como
devDependency, por isso o `npm install` normal já o instala.

### Se o `npm install` der erro de dependências

Se, mais tarde, um `npm install` falhar com `ERESOLVE` ou `ETARGET`
(porque o Expo SDK evoluiu entretanto), o mais fiável é deixar o próprio
Expo escolher as versões certas:

```bash
npx expo install --fix
```

Se mesmo assim houver conflitos, `npm install --legacy-peer-deps` é uma
alternativa aceitável para desbloquear.

### Validar os motores de cálculo

Os motores de cálculo são TypeScript puro (sem dependências de React
Native), por isso podem ser validados isoladamente:

```bash
npm run validate-calc    # pressão transpulmonar
npm run validate-tidal   # volume corrente / volume minuto
npm run validate-mp      # mechanical power
```

`validate-calc` compara a saída do motor com os valores exatos das
folhas de cálculo originais (caso de referência PEEP=8, Pplat=22,
PEsee=5,4, PEsei=16,3 cmH2O → PLee=2,6, PLei=5,7, DPl=3,1), incluindo
casos com unidades em mmHg e unidades mistas por campo. `validate-tidal`
confirma o peso ideal contra o mesmo caso de referência do NutriCIP e
testa as fronteiras da classificação do IMC. `validate-mp` confirma a
fórmula com casos de referência calculados à mão (incluindo a conversão
mL→L do Vc) e a fronteira dos 17 J/min.

### Verificar tipos

```bash
npm run typecheck
```

## Publicar a versão web no GitHub Pages (para testes)

A app não usa nenhuma funcionalidade nativa exclusiva de Android/iOS (só
componentes universais do React Native — a régua da FR é feita com
`PanResponder`/`Animated` do core, sem bibliotecas externas), por isso
também corre no browser através do **Expo Web** — útil para partilhar um
link de acesso rápido para testes, sem precisar de instalar nada.

### Configuração única (a fazer uma vez)

1. **Criar o repositório no GitHub** — em github.com, "New repository",
   nome sugerido `venticip` (pode ser outro nome, mas o passo 3 e o
   `app.json` têm de usar o mesmo, incluindo maiúsculas/minúsculas). Não
   inicializar com README/`.gitignore` (o projeto já os tem).
2. **Enviar o projeto local para o repositório**, a partir da pasta do
   projeto:
   ```bash
   git init
   git add .
   git commit -m "Versão inicial do VentiCIP"
   git branch -M main
   git remote add origin https://github.com/<o-teu-utilizador>/venticip.git
   git push -u origin main
   ```
3. **Adicionar suporte web** (só precisa de ser feito uma vez; o Expo CLI
   escolhe sozinho as versões corretas para o SDK instalado):
   ```bash
   npx expo install react-dom react-native-web @expo/metro-runtime
   ```
   Depois de instalado, é boa ideia testar localmente antes de configurar
   o GitHub: `npx expo start --web` e confirmar que a app abre bem no
   browser.
4. **Ativar o GitHub Pages no repositório**: Settings → Pages →
   "Build and deployment" → Source: **GitHub Actions** (não "Deploy from
   a branch").
5. Fazer commit e push das alterações do passo 3 (`package.json` e
   `package-lock.json` atualizados):
   ```bash
   git add package.json package-lock.json
   git commit -m "Adicionar suporte web (Expo Web)"
   git push
   ```

O `app.json` já tem `experiments.baseUrl` configurado como
`"/venticip"` — isto é necessário porque o GitHub Pages publica o
projeto numa subpasta do domínio (`utilizador.github.io/venticip/`), não
na raiz. **Se escolheres outro nome de repositório, tens de atualizar
este valor** em `app.json` para corresponder exatamente ao nome do
repositório (maiúsculas/minúsculas incluídas).

### A partir daqui, é automático

O workflow `.github/workflows/deploy-web.yml` já está configurado: a
cada `git push` para o branch `main`, o GitHub gera a versão web
(`npx expo export -p web`) e publica-a automaticamente no GitHub Pages —
não precisas de correr builds manualmente. Ao fim de alguns minutos, a
app fica acessível em:

```
https://<o-teu-utilizador>.github.io/venticip/
```

Podes acompanhar o progresso de cada publicação no separador **Actions**
do repositório no GitHub.

> ⚠️ Esta URL fica **pública** — qualquer pessoa com o link consegue
> aceder, sem autenticação. Dado que a app apoia decisões de ventilação
> mecânica em contexto clínico real, mantém presente o aviso já indicado
> no início deste README sobre confirmar valores e sobre enquadramento
> regulatório antes de a usar/divulgar como ferramenta oficial do
> serviço.

## Preparar para as lojas (Google Play / App Store)

1. Substituir os ícones placeholder em `assets/` (gerados automaticamente,
   apenas para o projeto arrancar) por ícones definitivos.
2. Definir o `bundleIdentifier` (iOS) e `package` (Android) em `app.json`
   — atualmente estão como `com.example.venticip`, um placeholder.
3. Criar conta de developer: Google Play Console (taxa única de 25 USD) e,
   se também quiseres publicar em iOS, Apple Developer Program
   (99 USD/ano).
4. Usar [EAS Build](https://docs.expo.dev/build/introduction/) para gerar
   os binários na cloud (não precisas de Android Studio nem de um Mac):
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   eas build --platform android --profile preview   # gera um .apk para testes/sideload
   eas build --platform android --profile production # gera o .aab para a Play Store
   ```
5. Submeter à Play Store com `eas submit --platform android`.
6. Preparar política de privacidade (obrigatória na Play Store) e
   screenshots. Como esta versão não recolhe nem armazena dados
   identificáveis do doente (os valores introduzidos não são guardados),
   a política de privacidade pode ser simples — mas confirma com
   compliance antes de publicar.

## Roteiro (ainda não implementado)

- Guardar/repetir a última medição (histórico simples, sem persistência
  de dados do doente).
- Rever com a equipa clínica se deve ser oferecida também a referência de
  ±2 cmH2O para a PL expiratória (Dostal & Dostalova 2023), como
  alternativa configurável ao alvo 0–5 cmH2O atualmente usado.
- Mais parâmetros nos Limites de Ventilação Mecânica além do Vc/VM já
  implementados.
- Rever com a equipa clínica se o limite de 17 J/min para a Mechanical
  Power é o valor a adotar no protocolo da UCIP, ou se preferem outro
  valor de referência.

## Estrutura do projeto

```
venticip/
├── .github/
│   └── workflows/
│       └── deploy-web.yml       # publica a versão web no GitHub Pages a cada push
├── index.ts                     # entry point (regista o App via Expo)
├── App.tsx                      # componente raiz — controla a navegação entre ecrãs
├── app.json                     # configuração Expo (nome, ícones, bundle id, baseUrl do Pages)
├── package.json
├── src/
│   ├── calc/
│   │   ├── transpulmonaryCalculator.ts  # motor de cálculo da pressão transpulmonar (puro, sem UI)
│   │   ├── validate.ts                  # validação contra a folha original
│   │   ├── tidalVolumeCalculator.ts     # motor de cálculo do Vc/VM (puro, sem UI)
│   │   ├── validateTidalVolume.ts       # validação do Vc/VM
│   │   ├── mechanicalPowerCalculator.ts # motor de cálculo da mechanical power (puro, sem UI)
│   │   └── validateMechanicalPower.ts   # validação da mechanical power
│   ├── components/
│   │   ├── SignatureFooter.tsx          # assinatura fixa no fundo da app
│   │   └── RulerSlider.tsx              # régua deslizante própria (sem dependências externas)
│   └── screens/
│       ├── HomeScreen.tsx                     # menu inicial
│       ├── TranspulmonaryPressureScreen.tsx   # calculadora de pressão transpulmonar
│       ├── VentilationLimitsScreen.tsx        # limites de ventilação (Vc/VM)
│       ├── MechanicalPowerScreen.tsx          # calculadora de mechanical power
│       └── ReferencesScreen.tsx               # fórmulas e esquemas de referência
└── assets/
    ├── icon.png, adaptive-icon.png, splash-icon.png, favicon.png  # placeholders, substituir antes de publicar
    └── referencias/              # imagens mostradas na página de Referências (recortadas do protocolo/literatura)
```

### Sobre a navegação

Para já, a navegação entre ecrãs é feita com estado simples do React (sem
nenhuma biblioteca de navegação) — o `App.tsx` guarda qual o ecrã atual e
passa uma função `onBack` / `onOpenX` a cada ecrã. Isto foi deliberado
para não introduzir mais dependências externas enquanto a app só tem
5 páginas. Se o número de páginas crescer bastante mais, vale a pena
migrar para [React Navigation](https://reactnavigation.org/).
