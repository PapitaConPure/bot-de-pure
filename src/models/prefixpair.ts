import Mongoose from 'mongoose';

const PrefixPairSchema = new Mongoose.Schema({
	guildId: { type: String, required: true },
	pure: {
		type: new Mongoose.Schema(
			{
				raw: { type: String, required: true },
				regex: { type: Mongoose.SchemaTypes.Mixed, required: true },
			},
			{ _id: false },
		),
		required: true,
	},
});

const PrefixPair = Mongoose.model('PrefixPair', PrefixPairSchema);

function m() {
	return new PrefixPair({});
}
export type PrefixPairDocument = ReturnType<typeof m>;

export default PrefixPair;
