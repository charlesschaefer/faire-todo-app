import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { Router } from "@angular/router";

interface OnboardingStep {
    title: string;
    description: string;
    image?: string;
    position: "top" | "bottom" | "left" | "right" | "center";
    element?: string;
    route?: string;
    icon?: string;
}

interface ElementRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

@Component({
    selector: "app-onboarding",
    standalone: true,
    imports: [CommonModule, TranslocoModule, ButtonModule, DialogModule],
    templateUrl: "./onboarding.component.html",
    styleUrls: ["./onboarding.component.scss"],
})
export class OnboardingComponent implements OnInit {
    showOnboarding = signal<boolean>(false);
    currentStep = signal<number>(0);

    steps: OnboardingStep[] = [];

    currentElementRect?: ElementRect;

    constructor(
        private translate: TranslocoService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.initializeSteps();
        this.checkIfFirstTimeUser();

        if (localStorage.getItem("onboardingCurrentStep") === null) {
            localStorage.setItem(
                "onboardingCurrentStep",
                this.currentStep().toString(),
            );
        } else {
            this.currentStep.set(
                parseInt(
                    localStorage.getItem("onboardingCurrentStep") || "0",
                    10,
                ),
            );
        }
        this.updateCurrentElementRect();
    }

    private checkIfFirstTimeUser(): void {
        try {
            // For testing purposes, always show the onboarding
            // Remove the next line and uncomment the conditional logic when ready for production
            //this.showOnboarding.set(true);

                
            const completed = localStorage.getItem("onboardingCompleted");
            if (completed !== "true") {
                this.showOnboarding.set(true);
            }
        } catch (error) {
            console.error("Error checking onboarding status:", error);
            // If there's an error, show the onboarding anyway
            this.showOnboarding.set(true);
        }
    }

    private initializeSteps(): void {
        this.steps = [
            {
                title: this.translate.translate("Welcome to Faire Todo App!"),
                description: this.translate.translate(
                    "Let's take a quick tour to help you get started with our powerful task manager. We'll show you how to organize your work and boost your productivity.",
                ),
                position: "center",
                icon: "pi pi-star",
            },
            {
                title: this.translate.translate("Create Tasks"),
                description: this.translate.translate(
                    'Add new tasks to your inbox by clicking the "+" button. You can set due dates, add descriptions, and organize your work efficiently.',
                ),
                position: "bottom",
                element: ".task-add-line",
                route: "/inbox",
                icon: "pi pi-plus-circle",
            },
            {
                title: this.translate.translate("Set Up Recurring Tasks"),
                description: this.translate.translate(
                    "Save time by creating recurring tasks for regular activities. Choose from daily, weekly, weekday, monthly, or yearly recurrence patterns.",
                ),
                position: "bottom",
                element: ".task-add-recurring",
                route: "/inbox",
                icon: "pi pi-sync",
            },
            {
                title: this.translate.translate("Prioritize Your Work"),
                description: this.translate.translate(
                    "Assign high, medium, or low priority to your tasks to focus on what matters most. Priority levels help you make quick decisions about what to tackle first.",
                ),
                position: "bottom",
                element: ".task-add-priority",
                route: "/inbox",
                icon: "pi pi-flag",
            },
            {
                title: this.translate.translate("Organize with Subtasks"),
                description: this.translate.translate(
                    "Break down complex tasks into smaller subtasks to make them more manageable and track progress on multi-step projects.",
                ),
                position: "bottom",
                element: ".task-add-subtask",
                route: "/inbox",
                icon: "pi pi-list",
            },
            {
                title: this.translate.translate("Add Attachments"),
                description: this.translate.translate(
                    "Attach files to your tasks to keep all relevant information in one place. No more searching through emails for that important document!",
                ),
                position: "bottom",
                element: ".task-item-attachments",
                route: "/inbox",
                icon: "pi pi-paperclip",
            },
            {
                title: this.translate.translate("Secure Data Synchronization"),
                description: this.translate.translate(
                    "Keep your tasks in sync across devices with our secure synchronization options. Choose between local network sync for privacy or Google sign-in for convenience.",
                ),
                position: "center",
                icon: "pi pi-cloud",
            },
            {
                title: this.translate.translate("Dark Mode Support"),
                description: this.translate.translate(
                    "Work comfortably day or night with our customizable dark mode. Reduce eye strain and save battery life while managing your tasks.",
                ),
                position: "right",
                element: ".theme-switch",
                icon: "pi pi-moon",
            },
            {
                title: this.translate.translate("Multiple Languages"),
                description: this.translate.translate(
                    "Faire Todo App speaks your language! Switch between multiple language options to use the app in your preferred language.",
                ),
                position: "right",
                element: ".language-selector",
                icon: "pi pi-globe",
            },
            {
                title: this.translate.translate("Organize with Projects"),
                description: this.translate.translate(
                    "Group related tasks together by creating projects. This keeps your work organized and helps you focus on specific areas of responsibility.",
                ),
                position: "left",
                element: ".task-add-project",
                route: "/project",
                icon: "pi pi-folder",
            },
            {
                title: this.translate.translate("Reorder Tasks"),
                description: this.translate.translate(
                    "Drag and drop tasks to reorder them according to your workflow. Prioritize visually by moving important tasks to the top of your list.",
                ),
                position: "right",
                element: ".task-item-handle",
                route: "/inbox",
                icon: "pi pi-sort",
            },
            {
                title: this.translate.translate("You're All Set!"),
                description: this.translate.translate(
                    "Now you know the powerful features of Faire Todo App. Enjoy staying organized and boosting your productivity with our advanced task management tools!",
                ),
                position: "center",
                icon: "pi pi-check-circle",
            },
        ];
    }

    nextStep(): void {
        if (this.currentStep() < this.steps.length - 1) {
            const nextStep = this.currentStep() + 1;
            const route = this.steps[nextStep].route;

            if (route && this.router.url !== route) {
                this.router.navigate([route]).then(() => {
                    setTimeout(() => {
                        this.currentStep.set(nextStep);
                        localStorage.setItem(
                            "onboardingCurrentStep",
                            nextStep.toString(),
                        );
                        this.highlightElement(this.steps[nextStep].element);
                        this.updateCurrentElementRect();
                    }, 500);
                });
            } else {
                this.currentStep.set(nextStep);
                localStorage.setItem(
                    "onboardingCurrentStep",
                    nextStep.toString(),
                );
                this.highlightElement(this.steps[nextStep].element);
                this.updateCurrentElementRect();
            }
        } else {
            this.completeOnboarding();
        }
    }

    previousStep(): void {
        if (this.currentStep() > 0) {
            const prevStep = this.currentStep() - 1;
            const route = this.steps[prevStep].route;

            if (route && this.router.url !== route) {
                this.router.navigate([route]).then(() => {
                    setTimeout(() => {
                        this.currentStep.set(prevStep);
                        localStorage.setItem(
                            "onboardingCurrentStep",
                            prevStep.toString(),
                        );
                        this.highlightElement(this.steps[prevStep].element);
                        this.updateCurrentElementRect();
                    }, 500);
                });
            } else {
                this.currentStep.set(prevStep);
                localStorage.setItem(
                    "onboardingCurrentStep",
                    prevStep.toString(),
                );
                this.highlightElement(this.steps[prevStep].element);
                this.updateCurrentElementRect();
            }
        }
    }

    skipOnboarding(): void {
        this.completeOnboarding();
    }

    completeOnboarding(): void {
        try {
            localStorage.setItem("onboardingCompleted", "true");
            localStorage.removeItem("onboardingCurrentStep");
            this.showOnboarding.set(false);
        } catch (error) {
            console.error("Error saving onboarding status:", error);
            this.showOnboarding.set(false);
        }
    }

    // Method to reset onboarding state for testing
    resetOnboarding(): void {
        localStorage.removeItem("onboardingCompleted");
        localStorage.removeItem("onboardingCurrentStep");
        this.currentStep.set(0);
        this.showOnboarding.set(true);
        // No need to call updateCurrentElementRect as we're not tracking elements
    }

    highlightElement(selector?: string): void {
        if (!selector) {
            this.currentElementRect = undefined;
            return;
        }

        setTimeout(() => {
            const element = document.querySelector(selector) as HTMLElement;
            if (element) {
                // Remove previous highlights
                document
                    .querySelectorAll(".onboarding-highlight")
                    .forEach((el) => {
                        el.classList.remove("onboarding-highlight");
                    });

                // Add highlight to current element
                element.classList.add("onboarding-highlight");

                // Scroll element into view if needed
                element.scrollIntoView({ behavior: "smooth", block: "center" });

                // Update spotlight rectangle
                const rect = element.getBoundingClientRect();
                this.currentElementRect = {
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height,
                };
            } else {
                this.currentElementRect = undefined;
            }
        }, 300);
    }

    updateCurrentElementRect(): void {
        const step = this.steps[this.currentStep()];
        if (step && step.element) {
            const element = document.querySelector(step.element) as HTMLElement;
            if (element) {
                const rect = element.getBoundingClientRect();
                this.currentElementRect = {
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height,
                };
                return;
            }
        }
        this.currentElementRect = undefined;
    }

    getStepIcon(stepIndex: number): string {
        // Custom icons for specific features
        const customIcons: { [key: number]: string } = {
            2: "pi pi-sync",
            3: "pi pi-flag-fill",
            6: "pi pi-cloud-upload",
            7: "pi pi-moon",
            8: "pi pi-globe",
        };

        return (
            customIcons[stepIndex] ||
            this.steps[stepIndex].icon ||
            "pi pi-info-circle"
        );
    }

    showSpotlight(): boolean {
        const step = this.steps[this.currentStep()];
        return !!(step && step.element && this.currentElementRect);
    }

    goToStep(stepIndex: number): void {
        if (stepIndex < 0 || stepIndex >= this.steps.length) return;
        const route = this.steps[stepIndex].route;
        if (route && this.router.url !== route) {
            this.router.navigate([route]).then(() => {
                setTimeout(() => {
                    this.currentStep.set(stepIndex);
                    localStorage.setItem(
                        "onboardingCurrentStep",
                        stepIndex.toString(),
                    );
                    this.highlightElement(this.steps[stepIndex].element);
                    this.updateCurrentElementRect();
                }, 500);
            });
        } else {
            this.currentStep.set(stepIndex);
            localStorage.setItem("onboardingCurrentStep", stepIndex.toString());
            this.highlightElement(this.steps[stepIndex].element);
            this.updateCurrentElementRect();
        }
    }
}
