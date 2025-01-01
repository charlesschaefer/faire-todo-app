import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class OtpGeneratorService {
        
    generateOTP() {
        const start = 65;
        const end = 90;
        let otpDigits = "";
        for (let i = 0; i < 6; i++) {
            const digit = this.getRandomDigit(start, end);
            otpDigits += String.fromCharCode(digit);
        }
        return otpDigits;
    }

    getRandomDigit(min: number , max: number) {
        const randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        const randomNumber = randomBuffer[0] / (0xFFFFFFFF + 1);
        return Math.floor(randomNumber * (max - min + 1) + min);
    }
}
