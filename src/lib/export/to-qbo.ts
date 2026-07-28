import type { Transaction } from "../statement-store";
import { sortByDate, triggerDownload } from "./types";

/**
 * QBO ("Web Connect") is OFX under the hood with QuickBooks-specific headers
 * (INTU.BID / INTU.USERID) added, imported via File > Utilities > Import >
 * Web Connect Files in QuickBooks Desktop. This mirrors to-ofx.ts's structure
 * with those headers included.
 */

function qboDate(iso: string): string {
  return iso.replace(/-/g, "") + "120000";
}

function fitid(t: Transaction, index: number): string {
  const hash = Math.abs(hashCode(t.description)).toString(36).slice(0, 6);
  return `${t.date.replace(/-/g, "")}-${index}-${hash}`;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function qboEscape(s: string): string {
  // Same reasoning as to-ofx.ts's ofxEscape -- SGML-OFX leaf tags have no
  // closing tag, so an embedded newline would split NAME/MEMO across two
  // lines and corrupt the field.
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\r\n]+/g, " ");
}

export function exportToQbo(transactions: Transaction[], fileName: string, accountId = "000000000") {
  const sorted = sortByDate(transactions);
  const start = sorted[0]?.date ? qboDate(sorted[0].date) : "19700101000000";
  const end = sorted[sorted.length - 1]?.date ? qboDate(sorted[sorted.length - 1].date) : "19700101000000";
  const lastBalance = [...sorted].reverse().find((t) => t.balance !== null)?.balance ?? 0;

  const stmttrns = sorted
    .map((t, i) => {
      const type = t.amount >= 0 ? "CREDIT" : "DEBIT";
      return `
        <STMTTRN>
          <TRNTYPE>${type}
          <DTPOSTED>${qboDate(t.date)}
          <TRNAMT>${t.amount.toFixed(2)}
          <FITID>${fitid(t, i)}
          <NAME>${qboEscape(t.description).slice(0, 32)}
          <MEMO>${qboEscape(t.description)}
        </STMTTRN>`;
    })
    .join("");

  const qbo = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
  <SIGNONMSGSRSV1>
    <SONRS>
      <STATUS>
        <CODE>0
        <SEVERITY>INFO
      </STATUS>
      <DTSERVER>${end}
      <LANGUAGE>ENG
      <INTU.BID>00000
    </SONRS>
  </SIGNONMSGSRSV1>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>1
      <STATUS>
        <CODE>0
        <SEVERITY>INFO
      </STATUS>
      <STMTRS>
        <CURDEF>USD
        <BANKACCTFROM>
          <BANKID>000000000
          <ACCTID>${accountId}
          <ACCTTYPE>CHECKING
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>${start}
          <DTEND>${end}${stmttrns}
        </BANKTRANLIST>
        <LEDGERBAL>
          <BALAMT>${lastBalance.toFixed(2)}
          <DTASOF>${end}
        </LEDGERBAL>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;

  const blob = new Blob([qbo], { type: "application/vnd.intu.qbo" });
  triggerDownload(blob, fileName);
}
