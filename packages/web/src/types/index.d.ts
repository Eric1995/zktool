import { Portal } from './portal';

declare global {
    let country: string;
    function multiply(a: number, b: number): number;
    interface Window{
        portal?: Portal;
        [k: string]: any;
    }
}
