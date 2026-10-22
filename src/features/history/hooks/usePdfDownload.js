import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Alert, Platform } from "react-native";
import { buildLeafHtml } from "../utils/pdfBuilder";

export function usePdfDownload({ t, currentUser, activeReg }) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPdf = async (historyArray, leafPeriod) => {
    try {
      setPdfLoading(true);
      const periodLabel =
        leafPeriod === "6m"
          ? "6 Month Leaf Collection Statement"
          : "12 Month (Annual) Leaf Collection Statement";

      const html    = buildLeafHtml({ historyArray, currentUser, activeReg, periodLabel });
      const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
      if (!uri) throw new Error("PDF file was not created");
      if (!base64) throw new Error("PDF data was not returned by the print service");
      const suffix  = leafPeriod === "6m" ? "6M" : "12M";
      const fileName = `LeafStatement_${activeReg?.regNo || "supplier"}_${suffix}_${Date.now()}`;

      // Save through Android's system Downloads provider so the PDF is visible
      // outside the app after the SDK 57 file-system changes.
      if (Platform.OS === "android" && FileSystem.StorageAccessFramework) {
        try {
          const rootDownloadUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot("Download");
          const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(rootDownloadUri);
          if (permission.granted && permission.directoryUri) {
            const savedUri = await FileSystem.StorageAccessFramework.createFileAsync(
              permission.directoryUri,
              fileName,
              "application/pdf"
            );
            await FileSystem.StorageAccessFramework.writeAsStringAsync(savedUri, base64, {
              encoding: FileSystem.EncodingType.Base64,
            });
            Alert.alert(t("downloadStatement"), t("statementSaved") || "Statement saved to Downloads");
            return;
          }
        } catch (saveError) {
          console.log("[pdf] Android Downloads save failed, falling back to sharing", saveError);
        }
      }

      const destinationDirectory = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      if (!destinationDirectory) throw new Error("No writable document directory");
      const dest    =
        destinationDirectory +
        `${fileName}.pdf`;

      // Expo Go's Print cache URI is not readable by FileSystem/Sharing on
      // Android. Write the returned base64 data into an accessible file first.
      try {
        await FileSystem.writeAsStringAsync(dest, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (writeError) {
        console.log("[pdf] accessible PDF write failed", writeError);
        throw writeError;
      }
      const shareUri = dest;
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(shareUri, {
          mimeType: "application/pdf",
          dialogTitle: periodLabel,
          UTI: "com.adobe.pdf",
        });
      }
      else Alert.alert(t("downloadStatement"), `${t("statementSaved") || "Statement saved"}: ${dest}`);
    } catch (e) {
      console.log(e);
      Alert.alert(t("noData"), t("pdfError"));
    } finally {
      setPdfLoading(false);
    }
  };

  return { pdfLoading, downloadPdf };
}
