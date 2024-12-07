import { Component } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { invoke } from '@tauri-apps/api/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputOtpModule } from 'primeng/inputotp';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { AES } from 'crypto-js';
import { HttpClient } from '@angular/common/http';
import { Message, MessageService } from 'primeng/api';
import { firstValueFrom, from } from 'rxjs';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

import { OtpGeneratorService } from '../services/otp-generator.service';
import { BackupService } from '../services/backup.service';
import { fetch } from '@tauri-apps/plugin-http';


@Component({
    selector: 'app-synchronization',
    standalone: true,
    imports: [
        DialogModule,
        TranslateModule,
        ButtonModule,
        CommonModule,
        ReactiveFormsModule,
        InputOtpModule,
        ProgressBarModule,
        ToastModule,
        CheckboxModule,
        InputTextModule,
        FormsModule,
    ],
    providers: [],
    templateUrl: './synchronization.component.html',
    styleUrl: './synchronization.component.scss'
})
export class SynchronizationComponent {
    getFromOthersVisible = false;
    sendToOthersVisible = false;

    otpData!: string;
    serverIp!: string;

    enableDiscoverButton = true;
    showOTPField = false;
    showProgressBar = false;

    fb = new FormBuilder();
    otpForm = this.fb.group({
        otp: ["", Validators.required]
    });

    useKnownIp = false;

    constructor(
        private otpGenerator: OtpGeneratorService,
        private backupService: BackupService,
        private httpClient: HttpClient,
        private messageService: MessageService,
        private translateService: TranslateService,
        private translate: TranslateService,
    ) {}

    openFromOthers() {
        this.getFromOthersVisible = true;
        this.sendToOthersVisible = false;
    }

    openToOthers() {
        this.sendToOthersVisible = true;
        this.getFromOthersVisible = false;
        this.otpData = "";
    }

    makeDeviceDiscoverable() {
        // generates OTP code
        let otp = this.otpGenerator.generateOTP();
        this.otpData = otp;
        console.log("OTP Data: ", otp);
        this.backupService.backupData(otp).subscribe(cryptedBackup => {
            console.log("Data backed up. broadcasting...", cryptedBackup);
            invoke('broadcast_network_sync_services').then(() => {
                console.log("Service broadcasted. Starting http server...");
                invoke('start_http_server', { otpCode: otp, backupData: cryptedBackup });
            });
        });
    }

    discoverDevices() {
        this.enableDiscoverButton = false;
        this.showProgressBar = true;
        console.log("Starting to discover devices...");
        // get devices with faire opened in the network
        invoke('search_network_sync_services').then(async (ipv4) => {
            console.log("Encountered the app in the machine with ip ", ipv4);
            this.messageService.add({
                summary: await firstValueFrom(this.translate.get("Device found")),
                detail: await firstValueFrom(this.translate.get("Your device was discovered with the IP: ")) + ipv4,
                severity: "success",
                key: "sync"
            });
            this.showOTPField = true;
            this.showProgressBar = false;
            this.serverIp = ipv4 as string;
        });
    }

    async sendEncryptedOTP(event: Event) {
        this.showProgressBar = true;
        console.log("Sending encripted data. OTP: ", this.otpForm.value.otp);
        //alert("Let's start the otp validation");
        const otp = this.otpForm.value.otp as unknown as string;
        if (!otp || otp.length < 6) {
            this.messageService.add({
                summary: await firstValueFrom(this.translateService.get("Error")),
                detail: await firstValueFrom(this.translateService.get("You need to type all the 6 letters correctly.")),
                severity: 'error',
                key: "sync"
            });
            return;
        }

        // alert("OTP Validated, let's start the handshake");
        
        try {
            // encrypts the otp and sends to the server 
            let encryptedOtp = AES.encrypt(otp , otp);
            let options = {
                headers: {
                    'X-SIGNED-TOKEN': encryptedOtp.toString()
                },
                responseType: 'text' as 'json' // HACK because angular @types has the type of responseType fixed as 'json' :shrug:
            };
            const url = `http://${this.serverIp}:9099/handshake`;
            //this.httpClient.post<string>(url, {}, options).subscribe({
            
            const response = await fetch(url, {method: "POST", headers: options.headers});
            if (!response.status) {
                // alert("Error with status: " + response.status);
                throw new Error("Error trying to handshake with device. Response status: " + response.status);
            }
            const backupData = await response.text();
            console.log("Data sent and backup received. Restoring backup...");
            // alert("Data sent and backup received. Restoring backup...");
            this.backupService.restoreBackup(backupData, otp).subscribe({
                complete: async () => {
                    console.log("Backup restored. Showing messages");
                    // alert("Data sent and backup received. Restoring backup...");
                    this.messageService.add({
                        summary: await firstValueFrom(this.translateService.get("Synchronized successfully")),
                        detail: await firstValueFrom(this.translateService.get("Your data was synchronized successfully.")),
                        severity: "success",
                        life: 4000,
                        key: "sync"
                    });
                    this.getFromOthersVisible = false;
                    this.showProgressBar = false;
                    await fetch(`http://${this.serverIp}:9099/disconnect`, {method: "POST"});
                },
                error: async (err) => {
                    console.log("Error recovering backup. Showing messages...", err);
                    // alert("Error recovering backup. Showing messages..." + err)
                    this.messageService.add({
                        summary: await firstValueFrom(this.translateService.get("Error synchronizing")),
                        detail: await firstValueFrom(this.translateService.get(`Error trying to synchronize data: `)) + err.toString(),
                        severity: 'error',
                        key: "sync"
                    });
                    this.showProgressBar = false;
                }
            });
        } catch (error) {
            this.messageService.add({
                severity: 'error', 
                summary: "Error encrypting OTP code",
                detail: "Error when tried to encrypt the OTP code: " + error,
                key: "sync"
            });
            this.showProgressBar = false;
            return;
        }

    }

    isValidIp(ip: string): boolean {
        if (!ip) return false;
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) return false;
        
        const parts = ip.split('.');
        return parts.every(part => {
            const num = parseInt(part, 10);
            return num >= 0 && num <= 255;
        });
    }
}
