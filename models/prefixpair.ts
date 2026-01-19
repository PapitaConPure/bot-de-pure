import Mongoose from 'mongoose';

const PrefixPairSchema = new Mongoose.Schema({
	guildId: { type: String },
	pure: {
		raw: { type: String, required: true },
		regex: { type: Mongoose.SchemaTypes.Mixed, required: true },
	},
});

const PrefixPair = Mongoose.model('PrefixPair', PrefixPairSchema);

function m() { return new PrefixPair({}); }
export type PrefixPairDocument = ReturnType<(typeof m)>;

export default PrefixPair;
