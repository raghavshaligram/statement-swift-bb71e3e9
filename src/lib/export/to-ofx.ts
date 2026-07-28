import type { Transaction } from "../statement-store";
import { sortByDate, triggerDownload } from "./types";

/**
 * Generates an OFX 1.0 (SGML-flavored) file — the widest-compatibility variant,
 * readable by Quicken, Microsoft Money, and most bank-import tools. We use
 * SGML-style OFX (no closing tags required on leaf elements) rather than
 * XML-flavored OFX 2.x since it has the broadest historical support.
 */

function ofxDate(iso: string): string {
  return iso.replace(/-/g, "") + "120000"; // noon, no timezone — safe default
}

function fitid(t: Transaction, index: number): string {
  // A stable-ish unique id per transaction: date + index + a hash-lite of description
  const hash = Math.abs(hashCode(t.description)).toString(36).slice(0, 6);
  return `${t.date.replace(/-/g, "")}-${index}-${hash}`;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function ofxEscape(s: string): string {
  // SGML-OFX leaf tags have no closing tag -- a value implicitly runs until
  // the next recognized tag or line break, so an embedded newline would
  // split NAME/MEMO across two lines and corrupt the field (same class of
  // risk as the tab/newline issues found in the IIF/QIF exporters).
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\r\n]+/g, " ");
}

export function exportToOfx(transactions: Transaction[], fileName: string, accountId = "000000000") {
  const sorted = sortByDate(transactions);
  const start = sorted[0]?.date ? ofxDate(sorted[0].date) : "19700101000000";
  const end = sorted[sorted.length - 1]?.date ? ofxDate(sorted[sorted.length - 1].date) : "19700101000000";
  const lastBalance = [...sorted].reverse().find((t) => t.balance !== null)?.balance ?? 0;

  const stmttrns = sorted
    .map((t, i) => {
      const type = t.amount >= 0 ? "CREDIT" : "DEBIT";
      return `
        <STMTTRN>
          <TRNTYPE>${type}
          <DTPOSTED>${ofxDate(t.date)}
          <TRNAMT>${t.amount.toFixed(2)}
          <FITID>${fitid(t, i)}
          <NAME>${ofxEscape(t.description).slice(0, 32)}
          <MEMO>${ofxEscape(t.description)}
        </STMTTRN>`;
    })
    .join("");

  const ofx = `OFXHEADER:100
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

  const blob = new Blob([ofx], { type: "application/x-ofx" });
  triggerDownload(blob, fileName);
}
