declare module 'check-english' {
  /**
   * Basic exported helper used in the project.
   * The runtime package may export different shapes; we declare the named export used in code.
   */
  export function isEnglish(word: string): boolean;
  export default isEnglish;
}
