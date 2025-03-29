// gradients.ts
// Типізований файл з градієнтами для використання в додатку

export interface GradientConfig {
    colors: string[];
    start: { x: number; y: number };
    end: { x: number; y: number };
    locations?: number[];
    angle?: number;
}

export type GradientType = 'primary' | 'multicolor' | 'purpleGreen';

export const gradients: Record<GradientType, GradientConfig> = {
    // pinc gradient
    primary: {
        colors: ['#F6E6EF', '#FAEFF5'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        angle: 90,
    },

    //
    multicolor: {
        colors: [
            'rgba(233, 123, 151, 0.36)',
            'rgba(242, 186, 201, 0.2952)',
            'rgba(192, 241, 233, 0.2448)',
            'rgba(134, 233, 214, 0.36)',
        ],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0.2 },
        locations: [0.009, 0.4385, 0.6318, 1.0828],
        angle: 106.95,
    },

    // purple-pink-green gradient
    purpleGreen: {
        colors: [
            'rgba(184, 143, 201, 0.56)',
            'rgba(255, 107, 129, 0.3808)',
            'rgba(184, 143, 201, 0.2464)',
            'rgba(107, 243, 202, 0.56)',
        ],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        locations: [-0.2814, 0.0048, 0.3845, 0.9338], // Відкориговані значення відповідно до оригіналу
        angle: 97.1,
    },
};

export const getGradient = (type: GradientType): GradientConfig => {
    return gradients[type];
};

export default gradients;