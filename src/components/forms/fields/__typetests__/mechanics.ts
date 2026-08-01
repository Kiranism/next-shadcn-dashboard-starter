/**
 * Isolated mechanics probe: template-literal Exclude with ${number}
 * placeholders on BOTH sides, against the real TanStack DeepKeys machinery.
 */
import type { DeepKeys, DeepKeysOfType } from '@tanstack/form-core';

type Expect<T extends true> = T;
type Eq<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

interface ProbeValues {
  title: string;
  severity: number;
  tags: string[];
  attachments: File[];
  avatar: File | null;
  gallery?: FileList;
  dueDate: Date | null;
  contact: { email: string };
}

// --- 0. What does the machinery yield TODAY? -------------------------------
type AllKeys = DeepKeys<ProbeValues>;
type TextKeys = DeepKeysOfType<ProbeValues, string | number | null | undefined>;

// 0a. Date is ALREADY atomic upstream: no dueDate subpaths exist.
type _dateAtomic = Expect<Eq<Extract<AllKeys, `dueDate.${string}`>, never>>;
// 0b. File is NOT atomic: its string/number props leak into text keys.
type _filePolluted = Expect<
  Eq<
    Extract<TextKeys, `attachments[${number}].${string}`>,
    | `attachments[${number}].name`
    | `attachments[${number}].type`
    | `attachments[${number}].size`
    | `attachments[${number}].lastModified`
    | `attachments[${number}].webkitRelativePath`
  >
>;
// 0c. Single File property also polluted via avatar.*
type _avatarPolluted = Expect<Eq<Extract<TextKeys, 'avatar.name'>, 'avatar.name'>>;
// 0d. File methods appear in DeepKeys as `.arrayBuffer.${string}`-style unknowns.
type MethodNoise = Extract<AllKeys, `avatar.arrayBuffer${string}`>;
type _methodNoise = Expect<Eq<MethodNoise extends never ? false : true, true>>;

// --- 1. Exclude with ${number} on both sides -------------------------------
// 1a. computed-key vs computed pattern
type P1 = Exclude<`attachments[${number}].name`, `attachments[${number}].${string}`>;
type _p1 = Expect<Eq<P1, never>>;
// 1b. literal-key vs computed pattern
type P2 = Exclude<'attachments[0].name', `attachments[${number}].${string}`>;
type _p2 = Expect<Eq<P2, never>>;
// 1c. the ROOT itself must survive the dot/bracket subpath patterns
type P3 = Exclude<
  `attachments[${number}]`,
  `attachments[${number}].${string}` | `attachments[${number}][${string}`
>;
type _p3 = Expect<Eq<P3, `attachments[${number}]`>>;
// 1d. trailing-${string} source keys (method noise) are absorbed too
type P4 = Exclude<`avatar.arrayBuffer.${string}`, `avatar.${string}`>;
type _p4 = Expect<Eq<P4, never>>;
// 1e. deep method noise under an array root
type P5 = Exclude<
  `attachments[${number}].arrayBuffer.${string}`,
  `attachments[${number}].${string}`
>;
type _p5 = Expect<Eq<P5, never>>;

// --- 2. Full post-filter dry run -------------------------------------------
type LeafValue = File | Blob | FileList | Date;
type LeafRoots = DeepKeysOfType<ProbeValues, LeafValue | null | undefined>;
// expect: 'avatar' | 'gallery' | 'dueDate' | `attachments[${number}]`
// (+ `gallery.${number}` — FileList's numeric index is itself File-valued)
type _roots = Expect<
  Eq<LeafRoots, 'avatar' | 'gallery' | 'dueDate' | `attachments[${number}]` | `gallery.${number}`>
>;

type LeafSubPaths = `${LeafRoots}.${string}` | `${LeafRoots}[${string}`;
type TextKeysClean = Exclude<TextKeys, LeafSubPaths>;
// After filtering: no attachments[...].* remains…
type _clean1 = Expect<Eq<Extract<TextKeysClean, `attachments[${number}].${string}`>, never>>;
type _clean2 = Expect<Eq<Extract<TextKeysClean, `avatar.${string}`>, never>>;
type _clean3 = Expect<Eq<Extract<TextKeysClean, `gallery${string}`>, never>>;
// …while real text paths survive.
type _keep1 = Expect<Eq<Extract<TextKeysClean, 'title'>, 'title'>>;
type _keep2 = Expect<Eq<Extract<TextKeysClean, `tags[${number}]`>, `tags[${number}]`>>;
type _keep3 = Expect<Eq<Extract<TextKeysClean, 'contact.email'>, 'contact.email'>>;

// File-valued whole paths survive for a File-contracted widget:
type FileKeys = DeepKeysOfType<ProbeValues, File | null | undefined>;
type FileKeysClean = Exclude<FileKeys, LeafSubPaths>;
type _fileWhole = Expect<Eq<FileKeysClean, 'avatar' | `attachments[${number}]`>>;
// literal index accepted against the surviving computed key:
type _fileLit = Expect<Eq<'attachments[0]' extends FileKeysClean ? true : false, true>>;

// File[]-contracted (upload widget) still gets the array root:
type FilesKeys = DeepKeysOfType<ProbeValues, File[] | null | undefined>;
type FilesKeysClean = Exclude<FilesKeys, LeafSubPaths>;
type _filesWhole = Expect<Eq<FilesKeysClean, 'attachments'>>;

// Date-contracted still gets dueDate:
type DateKeys = Exclude<DeepKeysOfType<ProbeValues, Date | null | undefined>, LeafSubPaths>;
type _dateKeys = Expect<Eq<DateKeys, 'dueDate'>>;

export type MechanicsChecked = true;
