import type { ShortlistCompany } from "@/components/materialRegister/CompanyShortlistTables";
import type { ShortlistPatent } from "@/components/materialRegister/PatentShortlistTable";
import type { ShortlistPaper } from "@/components/materialRegister/PaperShortlistTable";

/** Mock shortlisted companies shared between the Workspace and pathway profile. */
export const SHORTLIST_COMPANIES: ShortlistCompany[] = [
  {
    id: "company-1",
    name: "Corbion",
    profileUrl: "#company-corbion",
    country: "Netherlands",
    sector: "Bio-based chemicals",
    linkedNode: "Lactic Acid",
    role: "Producer",
    savedBy: "K. Brandt",
    rating: 4,
    teamRatings: [
      { author: "M. Rossi", value: 3 },
      { author: "A. Weber", value: 5 },
    ],
    teamNotes: [
      { id: "cn-1", author: "K. Brandt", timestamp: "2026-08-12 09:30", text: "Food-grade capacity confirmed for Europe." },
      { id: "cn-2", author: "M. Rossi", timestamp: "2026-08-28 14:05", text: "Quoted above our target price — renegotiate at volume." },
    ],
  },
  {
    id: "company-2",
    name: "Jungbunzlauer",
    profileUrl: "#company-jungbunzlauer",
    country: "Switzerland",
    linkedNode: "Lactic Acid",
    role: "Producer",
    savedBy: "A. Weber",
    rating: 3,
    teamRatings: [{ author: "K. Brandt", value: 4 }],
    teamNotes: [],
  },
  {
    id: "company-3",
    name: "Arla Foods Ingredients",
    profileUrl: "#company-arla",
    country: "Denmark",
    sector: "Dairy ingredients",
    linkedNode: "Whey permeate",
    role: "Supplier",
    savedBy: "M. Rossi",
    rating: 4,
    teamRatings: [{ author: "K. Brandt", value: 4 }],
    teamNotes: [
      { id: "cn-3", author: "M. Rossi", timestamp: "2026-09-01 11:20", text: "Permeate volumes available from Q2 2027." },
    ],
  },
  {
    id: "company-4",
    name: "Amcor Flexibles",
    profileUrl: "#company-amcor",
    country: "Switzerland",
    sector: "Packaging",
    linkedNode: "PLA packaging",
    role: "Offtaker",
    savedBy: "K. Brandt",

    teamNotes: [],
  },
];

/** Mock shortlisted patents shared between the Workspace and pathway profile. */
export const SHORTLIST_PATENTS: ShortlistPatent[] = [
  {
    id: "patent-1",
    title: "CONTINUOUS PURIFICATION OF FERMENTATION-DERIVED LACTIC ACID",
    applicant: "Corbion N.V.",
    filedDate: "16 Dec 2025",
    grantedDate: "04 Aug 2026",
    status: "Granted",
    jurisdictions: 3,
    savedBy: "K. Brandt",
    teamNotes: [
      { id: "pn-1", author: "K. Brandt", timestamp: "12 Sep 2026", text: "Covers the separation step our target pathway relies on." },
      { id: "pn-2", author: "M. Rossi", timestamp: "14 Sep 2026", text: "Check the EP claim scope before we approach Corbion." },
    ],
  },
  {
    id: "patent-2",
    title: "Low-carbon lactic acid from agricultural residues",
    applicant: "Jungbunzlauer Austria AG",
    filedDate: "04 Sept 2025",
    status: "Filed",
    jurisdictions: 1,
    savedBy: "A. Weber",
    teamNotes: [],
  },
];

/** Mock shortlisted papers shared between the Workspace and pathway profile. */
export const SHORTLIST_PAPERS: ShortlistPaper[] = [
  {
    id: "paper-1",
    title: "Commercial-scale lactic acid fermentation: process yield and cost assessment across renewable feedstocks",
    date: "1 Sept 2026",
    authors: ["E. Shahsavari", "A. Mohammadi", "R. Ghazi Tabatabaei"],
    savedBy: "K. Brandt",
    teamNotes: [
      { id: "ppn-1", author: "K. Brandt", timestamp: "12 Sept 2026", text: "Yield data at pilot scale matches our pathway assumptions." },
      { id: "ppn-2", author: "M. Rossi", timestamp: "14 Sept 2026", text: "Cost model excludes downstream purification — verify before citing." },
    ],
  },
  {
    id: "paper-2",
    title: "European lactic acid supply outlook: producer capacity, geography and market availability review",
    date: "20 May 2026",
    authors: ["J. Verhoeven", "L. Marchetti"],
    savedBy: "A. Weber",
    teamNotes: [],
  },
];
