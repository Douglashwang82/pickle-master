type CommonRow = Record<string, unknown> & {
	id: string;
	user_id: string;
	club_id: string;
	session_id: string;
	auth_provider_user_id: string;
	email: string;
	slug: string;
	name: string;
	title: string;
	description: string | null;
	rules: string | null;
	cover_image_url: string | null;
	image_url: string | null;
	sport_type: string;
	public_status: string;
	owner_user_id: string;
	role: string;
	status: string;
	created_at: string;
	updated_at: string;
	joined_at: string;
	scheduled_start_at: string;
	location_name: string;
	capacity: number;
	fee_twd: number;
	amount_twd: number;
	platform_fee_twd: number;
	net_amount_twd: number;
	payment_transaction_id: string | null;
	gateway_payment_id: string | null;
	debt_notified_at: string | null;
	display_name: string;
	photo_url: string | null;
	skill_level: string | null;
	bio: string | null;
	intro_message: string | null;
	author_user_id: string;
	kind: "announcement" | "note";
	body: string;
	importance: "normal" | "important";
	is_pinned: boolean;
	rejection_reason: string | null;
	reviewed_by: string | null;
	reviewed_at: string | null;
	published_at: string | null;
	token: string;
	use_count: number;
	expires_at: string | null;
	max_uses: number | null;
	is_active: boolean;
	membership_type: "open" | "application";
	rating: number;
	reputation_score: number;
	review_count: number;
	reviewer_user_id: string;
	reviewee_user_id: string;
	venue_id: string;
	facilities_rating: number;
	lighting_rating: number;
	floor_rating: number;
	transport_rating: number;
	comment: string | null;
	users: unknown;
};

type GenericTable = {
	Row: CommonRow;
	Insert: Record<string, unknown>;
	Update: Record<string, unknown>;
	Relationships: {
		foreignKeyName: string;
		columns: string[];
		isOneToOne?: boolean;
		referencedRelation: string;
		referencedColumns: string[];
	}[];
};

type GenericView = {
	Row: Record<string, unknown>;
	Relationships: {
		foreignKeyName: string;
		columns: string[];
		isOneToOne?: boolean;
		referencedRelation: string;
		referencedColumns: string[];
	}[];
};

type GenericFunction = {
	Args: Record<string, unknown> | never;
	Returns: unknown;
};

type WaitlistRow = {
	id: string;
	session_id: string;
	user_id: string;
	status: "active" | "promoted" | "left";
	joined_at: string;
	promoted_at: string | null;
	left_at: string | null;
	promoted_registration_id: string | null;
	created_at: string;
	updated_at: string;
};

type WaitlistInsert = {
	id?: string;
	session_id: string;
	user_id: string;
	status?: "active" | "promoted" | "left";
	joined_at?: string;
	promoted_at?: string | null;
	left_at?: string | null;
	promoted_registration_id?: string | null;
	created_at?: string;
	updated_at?: string;
};

type WaitlistUpdate = Partial<WaitlistInsert>;

type AnalyticsEventRow = {
	id: string;
	event_name: string;
	user_id: string | null;
	club_id: string | null;
	session_id: string | null;
	properties_json: Record<string, string | number | boolean | null>;
	occurred_at: string;
};

type AnalyticsEventInsert = {
	id?: string;
	event_name: string;
	user_id?: string | null;
	club_id?: string | null;
	session_id?: string | null;
	properties_json?: Record<string, string | number | boolean | null>;
	occurred_at?: string;
};

type AnalyticsEventUpdate = Partial<AnalyticsEventInsert>;

export type Database = {
	public: {
		Tables: Record<string, GenericTable> & {
			users: GenericTable;
			profiles: GenericTable;
			clubs: GenericTable;
			club_memberships: GenericTable;
			membership_applications: GenericTable;
			sessions: GenericTable;
			session_registrations: GenericTable;
			payment_transactions: GenericTable;
			refund_transactions: GenericTable;
			notifications: GenericTable;
			venues: GenericTable;
			venue_reviews: GenericTable;
			peer_reviews: GenericTable;
			club_invite_links: GenericTable;
			club_board_posts: GenericTable;
			club_board_reactions: GenericTable;
			analytics_events: {
				Row: AnalyticsEventRow;
				Insert: AnalyticsEventInsert;
				Update: AnalyticsEventUpdate;
				Relationships: [];
			};
			session_waitlist_entries: {
				Row: WaitlistRow;
				Insert: WaitlistInsert;
				Update: WaitlistUpdate;
				Relationships: [];
			};
		};
		Views: Record<string, GenericView>;
		Functions: Record<string, GenericFunction>;
		Enums: Record<string, string>;
		CompositeTypes: Record<string, never>;
	};
};
