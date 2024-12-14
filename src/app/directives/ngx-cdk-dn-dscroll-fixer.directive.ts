import { style } from '@angular/animations';
import { Directive, ElementRef } from '@angular/core';
import { add, remove } from 'dexie';
import { DateTime } from 'luxon';
import { concatAll, of, timer } from 'rxjs';
import { fromEvent, Observable } from 'rxjs';

type Timer = ReturnType<typeof setTimeout>;


@Directive({
    selector: '[appNgxCdkDnDScrollFixer]',
    standalone: true
})
export class NgxCdkDnDScrollFixerDirective {

    private clickEventObserver!: Observable<MouseEvent | PointerEvent>;
    private moveEventObserver!: Observable<MouseEvent | PointerEvent>;
    private startY = -1;
    private startMouseY = -1;
    private startX = -1;
    private updatedX = -1;
    private updatedY = -1;
    private startTime = 0;
    private timeoutDuration = 500; // milliseconds
    private timeoutId?: Timer;
    private currentAction = '';
    private ticking = false;
    private dragging = false;


    constructor(private el: ElementRef) { 
        this.clickEventObserver = of(
            fromEvent<PointerEvent>(this.el.nativeElement, 'pointerdown', {capture: true}),
            // fromEvent<TouchEvent>(this.el.nativeElement, 'touchstart', {capture: true}),
            fromEvent<MouseEvent>(this.el.nativeElement,'mousedown',{ capture: true })
        ).pipe(concatAll());
        this.clickEventObserver.subscribe({
            next: (ev) => {
                console.log("Entrou no pointerdown =>", ev.type)
                this.pointerDown(ev);
            },
            complete: () => {

            }
        });

        this.moveEventObserver = of(
                fromEvent<PointerEvent>(this.el.nativeElement,'pointermove',{capture: true}),
            fromEvent<MouseEvent>(this.el.nativeElement,'mousemove',{capture: true})
        ).pipe(concatAll());
        this.moveEventObserver.subscribe((ev) => {
            this.pointerMove(ev);
        });

        of(
            fromEvent<PointerEvent>(this.el.nativeElement, 'pointerup', {capture: true}),
            fromEvent<MouseEvent>(this.el.nativeElement, 'mouseup', {capture: true})
        ).pipe(concatAll()).subscribe(this.pointerUp)
    }

    pointerDown(ev: PointerEvent | MouseEvent) {
        console.warn("Iniciamos o processo...")
        this.startY = ev.pageY;
        this.startX = ev.pageX;
        this.startMouseY = ev.clientY;
        this.startTime = Date.now();
        this.timeoutId = setTimeout(() => {
            console.log("Venceu o timeout")
        }, this.timeoutDuration);
        this.dragging = true;
    }

    pointerMove(ev: PointerEvent | MouseEvent) {
        if (this.dragging) {
            console.log(`Mouse mexeu: x1=${this.startX} y1=${this.startY}; x2=${ev.clientX} y2=${ev.clientY}`)
            const rect = (ev.target as Element).getBoundingClientRect();
            const timeoutExpired = Date.now() - this.startTime >= this.timeoutDuration;
            const xMoved = ev.clientX - this.startX;
            const yMoved = ev.clientY - this.startMouseY;

            console.error(`Movimento x: ${xMoved} - y: ${yMoved}`)

            // ainda não sabemos a intenção do usuário
            if (this.currentAction == '') {
                console.log("Ainda não sabemos a intenção")
                if (!timeoutExpired) {
                    console.log("Ainda estamos dentro do timeout")
                    if (xMoved == 0 && yMoved == 0) {
                        console.log("Sem movimento... aguardando próximo evento")
                        // Ainda temos que esperar para saber sua intenção
                        return;
                    } else {
                        console.warn("INTENÇÃO: SCROLL")
                        this.currentAction = 'scroll';
                        clearTimeout(this.timeoutId);
                    }
                } else {
                    this.currentAction = 'dnd';
                    console.warn("INTENÇÃO: DND")
                }
            }

            if (this.currentAction == 'scroll') {
                this.updateScroll(ev);
            }
        }
    }

    pointerUp(ev: PointerEvent | MouseEvent) {
        console.warn("Tudo finalizado, limpando a casa.")
        if (this.timeoutId) clearTimeout(this.timeoutId);
        if (this.dragging) {
            // Reset position
            this.dragging = false;
            this.startX = -1;
            this.startY = -1;
            this.currentAction = '';
            this.startTime = 0;
            delete this.timeoutId;
        }
    }

    updateScroll(ev: PointerEvent | MouseEvent) {
        const rect = (ev.target as Element).getBoundingClientRect();
        // console.log(`=================== boundingClientRect(): ${rect.left} x ${rect.top}`)
        // console.log(`=================== clientXY: ${ev.clientX} x ${ev.clientY}`)

        this.updatedX = ev.clientX;
        // this.updatedY = (this.startY - (this.startMouseY));
        this.updatedY = (ev.clientY - (this.startMouseY));
        console.log("updatedY: ", this.startY, " startMouseY: ", this.startMouseY)
        console.log(`Scroll from ${ev.clientY} to ${this.updatedY} --- Ticking: ${this.ticking}`)
        if (!this.ticking) {
            // window.requestAnimationFrame(() => {
            setTimeout(() => {
                console.warn(`Indo para: ${this.updatedY}`)
                //const currentY = ev.clientY;
                window.scroll({
                    top: this.updatedY,
                    left: this.startX
                });
                this.ticking = false;
            }, 5);

            this.ticking = true;
        }
    }

}
