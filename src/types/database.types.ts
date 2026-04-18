type GenericTable = {
	Row: Record<string, unknown>;
	Insert: Record<string, unknown>;
	Update: Record<string, unknown>;
	Relationships?: unknown[];
};

type GenericView = {
	Row: Record<string, unknown>;
	Relationships?: unknown[];
};

type GenericFunction = {
	Args: Record<string, unknown>;
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
