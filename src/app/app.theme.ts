import { size } from '@jsverse/transloco';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

export const AppTheme = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#fffaf3',
            100: '#fde8c4',
            200: '#fbd596',
            300: '#f9c368',
            400: '#f7b039',
            500: '#f59e0b',
            600: '#d08609',
            700: '#ac6f08',
            800: '#875706',
            900: '#623f04',
            950: '{amber.950}'
        }
    },
    components: {
        datepicker: {
            colorScheme: {
                light: {
                    root: {
                        dropdown: {
                            background: '{primary.color}',
                            hoverBackground: '{primary.600}',
                            activeBackground: '{primary.700}',
                            color: '{primary.contrast.color}',
                            hoverColor: '{ primary.contrast.color }',
                            activeColor: '{ primary.contrast.color }',
                        },
                        inputIconColor: '{primary.color}',
                    }
                }
            }
        },
        textarea: {
            colorScheme: {
                light: {
                    root: {
                        focusRing: {
                            color: '{primary.color}',
                            offset: '1px',
                            style: 'solid',
                            width: '1px'
                        }
                    }
                }
            }
        },
        menu: {
            colorScheme: {
                light: {
                    root: {
                        // borderColor: 'rgba(0, 0, 0, 0)',
                        // itemIconColor: '{primary.color}',
                        // itemIconFocusColor: '{primary.color}',
                        submenuLabelColor: '{text.muted.color}'
                    }
                }
            }
        },
        drawer: {
            colorScheme: {
                light: {
                    root: {
                        headerPadding: '10px',
                        contentPadding: '0 18px 18px 18px'
                    }
                }
            }
        },
        inputtext: {
            smFontSize: '0.8rem'
        }
    }
});

