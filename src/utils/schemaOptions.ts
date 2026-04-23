const ALWAYS_STRIP = ['__v'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeSchemaOptions(stripFields: string[] = []): any {
    const fields = [...ALWAYS_STRIP, ...stripFields];

    const transform = (_doc: unknown, ret: Record<string, unknown>) => {
        for (const field of fields) delete ret[field];
        return ret;
    };

    return {
        timestamps: true,
        versionKey: false,
        toJSON: {transform},
        toObject: {transform},
    };
}
