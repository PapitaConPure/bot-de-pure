import Mongoose, { type InferSchemaType } from 'mongoose';
import type { PureVoiceSessionMemberRole } from '@/systems/others/purevoice';

/**Defines the configuration and state of a PuréVoice system in a particular Discord guild.*/
const PureVoiceSchema = new Mongoose.Schema(
	{
		guildId: {
			type: String,
			required: true,
		},
		/**The ID of the Discord category in which the system is installed.*/
		categoryId: {
			type: String,
			default: '',
		},
		/**The ID of the Discord channel currently designated by the system for voice session deployment.*/
		voiceMakerId: {
			type: String,
			default: '',
		},
		/**The Discord channel ID of the system's control pannel.*/
		controlPanelId: {
			type: String,
			default: '',
		},
		/**A List of Discord channel IDs corresponding to all the system's currently-alive sessions.*/
		sessions: {
			type: [String],
			default: [],
		},
	},
	{
		methods: {
			/**Marks 'sessions' as modified. Does not save the document.*/
			removeFromSessionsList(sessionId: string) {
				const indexToDelete = this.sessions.indexOf(sessionId);
				if (indexToDelete >= 0) {
					this.sessions.splice(indexToDelete, 1);
					this.markModified('sessions');
				}
			},
		},
	},
);

export type PureVoiceSchemaType = InferSchemaType<typeof PureVoiceSchema>;

export const PureVoiceModel = Mongoose.model('PureVoice', PureVoiceSchema);

export type PureVoiceDocument = InstanceType<typeof PureVoiceModel>;

/**Represents a particular member of a PuréVoice system voice session.*/
const PureVoiceSessionMemberSchema = new Mongoose.Schema(
	{
		/**The member's Discord ID.*/
		id: {
			type: String,
			required: true,
		},
		/**The member's role in the session.*/
		role: {
			type: Number,
			enum: [0, 1, 2] as const satisfies PureVoiceSessionMemberRole[],
			required: true,
		},
		/**Whether the member is allowed to join the session while its frozen (`true`) or not (`false`).*/
		whitelisted: {
			type: Boolean,
			required: true,
		},
		/**Whether the member is banned from joining the session (`true`) or not (`false`).*/
		banned: {
			type: Boolean,
			required: true,
		},
	},
	{ _id: false },
);

/**Defines an alive PuréVoice system voice session.*/
const PureVoiceSessionSchema = new Mongoose.Schema({
	/**The session's associated Discord channel ID.*/
	channelId: {
		type: String,
		required: true,
	},
	/**The session's associated Discord role ID.*/
	roleId: {
		type: String,
		required: true,
	},
	/**The session's admin's Discord user ID.*/
	adminId: {
		type: String,
		required: true,
	},
	/**A List containing the Discord user IDs of all the session's mods.*/
	modIds: {
		type: Array,
		default: [],
	},
	/**Whether the session is frozen (`true`) or not (`false`).*/
	frozen: {
		type: Boolean,
		default: false,
	},
	/**How long it takes (in milliseconds) to destroy a session after it's been abandoned by applicable all members.*/
	killDelayMs: {
		type: Number,
	},
	/**Collection of all registered members for a session, regarless of if they're currently active or not.*/
	members: {
		type: Map,
		of: PureVoiceSessionMemberSchema,
		default: () => new Map(),
	},
	/**Specifies the last time the name of the session was changed.*/
	nameChangedAt: {
		type: Date,
		default: null,
	},
	/**Specifies the last time the session was active (not abandoned).*/
	lastActiveAt: {
		type: Date,
		default: null,
	},
});

export type PureVoiceSessionSchemaType = InferSchemaType<typeof PureVoiceSessionSchema>;

export const PureVoiceSessionModel = Mongoose.model('PureVoiceSession', PureVoiceSessionSchema);

export type PureVoiceSessionDocument = InstanceType<typeof PureVoiceSessionModel>;
