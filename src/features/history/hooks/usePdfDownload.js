import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Alert } from "react-native";
import { buildLeafHtml } from "../utils/pdfBuilder";

export function usePdfDownload({ t, currentUser, activeReg }) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPdf = async (historyArray, leafPeriod) => {
    try {
      setPdfLoading(true);
      if (!historyArray.length) {
        Alert.alert(t("noData"), t("noHistoryForPdf"));
        return;
      }
      const periodLabel =
        leafPeriod === "6m"
          ? "6 Month Leaf Collection Statement"
          : "12 Month (Annual) Leaf Collection Statement";

      const html    = buildLeafHtml({ historyArray, currentUser, activeReg, periodLabel });
      const { uri } = await Print.printToFileAsync({ html });
      const suffix  = leafPeriod === "6m" ? "6M" : "12M";
      const dest    =
        FileSystem.documentDirectory +
        `LeafStatement_${activeReg?.regNo || "supplier"}_${suffix}_${Date.now()}.pdf`;

      await FileSystem.moveAsync({ from: uri, to: dest });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(dest);
      else          Alert.alert(t("downloadStatement"), dest);
    } catch (e) {
      console.log(e);
      Alert.alert(t("noData"), t("pdfError"));
    } finally {
      setPdfLoading(false);
    }
  };

  return { pdfLoading, downloadPdf };
}
