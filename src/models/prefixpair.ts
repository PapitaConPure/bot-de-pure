import Mongoose, { type InferSchemaType } from 'mongoose';

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

export type PrefixPairSchemaType = InferSchemaType<typeof PrefixPairSchema>;

const PrefixPairModel = Mongoose.model('PrefixPair', PrefixPairSchema);

export type PrefixPairDocument = InstanceType<typeof PrefixPairModel>;

export default PrefixPairModel;
