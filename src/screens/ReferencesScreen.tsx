import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface ReferencesScreenProps {
  onBack: () => void;
}

const monoFont = Platform.select({ ios: "Courier", android: "monospace", default: "monospace" });

function FormulaLine({ formula, note }: { formula: string; note?: string }) {
  return (
    <View style={styles.formulaLine}>
      <Text style={styles.formulaText}>{formula}</Text>
      {note ? <Text style={styles.formulaNote}>{note}</Text> : null}
    </View>
  );
}

// Todas as imagens de referência usam a mesma moldura de altura fixa: cabem sempre
// dentro do ecrã do telemóvel (nunca ultrapassam a largura do cartão), com "contain"
// a preservar as proporções originais — tabelas mais largas ficam com uma faixa de
// fundo acima/abaixo, imagens mais altas preenchem a moldura na vertical. Tocar na
// imagem abre a versão em ecrã inteiro com zoom.
const REFERENCE_IMAGE_HEIGHT = 260;
const screenWidth = Dimensions.get("window").width;

function RefImage({
  source,
  aspectRatio,
  caption,
}: {
  source: number;
  aspectRatio: number;
  caption: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.imageBlock}>
      <TouchableOpacity
        style={styles.imageFrame}
        activeOpacity={0.85}
        onPress={() => setExpanded(true)}
        accessibilityRole="button"
        accessibilityLabel="Ampliar imagem"
      >
        <Image source={source} style={styles.imageThumb} resizeMode="contain" />
      </TouchableOpacity>
      <Text style={styles.imageCaption}>{caption}</Text>
      <Text style={styles.imageHint}>Toca na imagem para ampliar</Text>

      <Modal visible={expanded} transparent animationType="fade" onRequestClose={() => setExpanded(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setExpanded(false)}
            accessibilityRole="button"
          >
            <Text style={styles.modalCloseText}>✕ Fechar</Text>
          </TouchableOpacity>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <Image source={source} style={[styles.modalImage, { aspectRatio }]} resizeMode="contain" />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export default function ReferencesScreen({ onBack }: ReferencesScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityRole="button">
        <Text style={styles.backButtonText}>‹ Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Referências</Text>
      <Text style={styles.subtitle}>Fórmulas e esquemas usados nos cálculos da app</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pressão Transpulmonar (balão esofágico)</Text>
        <Text style={styles.sectionIntro}>
          Portado das folhas de cálculo `Balão Esofágico.xlsx` / `Balão Esofágico (com valores
          alvo).xlsx` usadas na UCIP.
        </Text>

        <FormulaLine
          formula="PLee (PL expiratória) = PEEP − PEsee"
          note="Alvo: 0 a 5 cmH2O (<0 atelectrauma; >5 barotrauma)"
        />
        <FormulaLine
          formula="PLei (PL inspiratória) = Pplat − PEsei"
          note="Alvo: < 20 cmH2O"
        />
        <FormulaLine
          formula="DPl (Driving PL) = (Pplat − PEEP) − (PEsei − PEsee)"
          note="Alvo: < 12 cmH2O"
        />
        <FormulaLine
          formula="Driving Pressure convencional = Pplat − PEEP"
          note="Medida clássica (não transpulmonar), mostrada como referência"
        />
        <FormulaLine formula="1 mmHg = 1,36 cmH2O" note="Conversão usada quando o input é em mmHg" />

        <Text style={styles.sectionSubtitle}>Esquemas de referência</Text>

        <RefImage
          source={require("../../assets/referencias/tabela1-metodos.png")}
          aspectRatio={1775 / 440}
          caption="Tabela 1 — métodos sugeridos para calcular a PL inspiratória, expiratória, total e a driving pressure transpulmonar. Adaptado de Dostal & Dostalova (2023), J Pers Med."
        />
        <RefImage
          source={require("../../assets/referencias/tabela3-limites.png")}
          aspectRatio={1775 / 440}
          caption="Tabela 3 — limites sugeridos de pressões transpulmonares em doentes com ARDS. Adaptado de Dostal & Dostalova (2023), J Pers Med."
        />
        <RefImage
          source={require("../../assets/referencias/conceito-ptranspulm.png")}
          aspectRatio={1420 / 735}
          caption="Conceito: a pressão transpulmonar é a diferença entre a pressão das vias aéreas (Paw) e a pressão esofágica (Pes). Hamilton Medical, '10 Expert Tips' (2015)."
        />
        <RefImage
          source={require("../../assets/referencias/exemplo-peep-7-9.png")}
          aspectRatio={543 / 614}
          caption="Exemplos de titulação de PEEP pela PL expiratória: PEEP 7 cmH2O (PL expiratória negativa, risco de atelectrauma) e PEEP 9 cmH2O (PL expiratória ≈0, dentro do alvo)."
        />
        <RefImage
          source={require("../../assets/referencias/exemplo-peep-11.png")}
          aspectRatio={635 / 700}
          caption="Terceiro exemplo da mesma série: PEEP 11 cmH2O, PL expiratória ≈2 cmH2O — dentro do alvo, prevenindo atelectrauma."
        />

        <Text style={styles.sourceText}>
          Fontes: Protocolo "Uso da Sonda Nasogástrica Polifuncional Nutrivent™ para monitorização
          da pressão esofágica na UCIP" (CHEDV); Dostal, P.; Dostalova, V. Practical Aspects of
          Esophageal Pressure Monitoring in ARDS. J. Pers. Med. 2023, 13, 136; Garnero, A.; Arnal,
          J. 10 Expert Tips — Esophageal Pressure Measurement in ARDS Patients, Hamilton Medical,
          2015.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Volume Corrente (Vc) e Volume Minuto (VM)</Text>
        <Text style={styles.sectionIntro}>
          Regra definida pela equipa da UCIP para o ecrã "Limites de Ventilação Mecânica".
        </Text>

        <FormulaLine formula="IMC = peso (kg) / altura (m)²" />
        <FormulaLine
          formula="Peso ideal (Devine) = 50 + 0,91×(altura_cm−152,4)"
          note="Fórmula para homens; mulheres: 45,5 + 0,91×(altura_cm−152,4). Igual à do NutriCIP."
        />
        <FormulaLine
          formula="Peso usado = peso real (se IMC 18,5–24,9) ou peso ideal (caso contrário)"
        />
        <FormulaLine formula="Vc (volume corrente) = 6 a 8 mL × peso usado" />
        <FormulaLine formula="VM (volume minuto) = Vc × FR" note="FR = frequência respiratória, em ciclos/min" />
      </View>

      <Text style={styles.disclaimer}>
        Os valores e alvos apresentados nesta página refletem as fontes citadas e as decisões da
        equipa clínica da UCIP no momento em que a app foi construída. Confirma sempre com o
        protocolo do teu serviço antes de usar clinicamente.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: "#F4F6F8" },
  backButton: { alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 4, marginBottom: 4 },
  backButtonText: { fontSize: 15, color: "#12283C", fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700", color: "#12283C", textAlign: "center" },
  subtitle: {
    fontSize: 13,
    color: "#5B6B7A",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#12283C" },
  sectionIntro: { fontSize: 12, color: "#7A8894", marginTop: 4, marginBottom: 12, fontStyle: "italic" },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5B6B7A",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 14,
    marginBottom: 8,
  },
  formulaLine: {
    backgroundColor: "#F7F9FA",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  formulaText: { fontFamily: monoFont, fontSize: 13, color: "#12283C" },
  formulaNote: { fontSize: 11, color: "#5B6B7A", marginTop: 3 },
  imageBlock: { marginBottom: 20 },
  imageFrame: {
    width: "100%",
    height: REFERENCE_IMAGE_HEIGHT,
    backgroundColor: "#F7F9FA",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E4E9ED",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imageThumb: { width: "100%", height: "100%" },
  imageCaption: { fontSize: 11, color: "#5B6B7A", marginTop: 8, lineHeight: 15 },
  imageHint: { fontSize: 10, color: "#9AA7B0", marginTop: 3, fontStyle: "italic" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(11,22,32,0.96)", paddingTop: 44 },
  modalClose: { alignSelf: "flex-end", paddingHorizontal: 20, paddingVertical: 10 },
  modalCloseText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  modalScroll: { flex: 1 },
  modalScrollContent: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  modalImage: { width: screenWidth - 32 },
  sourceText: { fontSize: 10, color: "#8894A0", marginTop: 4, lineHeight: 14 },
  disclaimer: { fontSize: 11, color: "#8894A0", textAlign: "center", marginTop: 8, lineHeight: 16 },
});
