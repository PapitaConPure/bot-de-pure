export function makeStringIdValidator<TMessage extends string>(message: TMessage): { validate: (v: string) => boolean; message: () => TMessage; } {
	return {
		validate: v => v?.length > 0,
		message: () => message,
	};
}
