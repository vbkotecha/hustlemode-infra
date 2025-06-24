import os
import logging
import pg8000
from typing import Optional, Dict, List, Tuple
import uuid
from datetime import datetime

class DatabaseConnection:
    """PostgreSQL database connection manager for HustleMode.ai"""
    
    def __init__(self):
        self.connection_params = {
            'host': os.environ.get('DATABASE_HOST'),
            'database': os.environ.get('DATABASE_NAME'),
            'user': os.environ.get('DATABASE_USER'),
            'password': os.environ.get('DATABASE_PASSWORD'),
            'port': os.environ.get('DATABASE_PORT', '5432'),
            'sslmode': os.environ.get('DATABASE_SSL_MODE', 'require')
        }
    
    def get_connection(self):
        """Get a database connection"""
        try:
            # Try with ssl_context as boolean first
            conn = pg8000.connect(
                host=self.connection_params['host'],
                database=self.connection_params['database'],
                user=self.connection_params['user'],
                password=self.connection_params['password'],
                port=int(self.connection_params['port']),
                ssl_context=True
            )
            return conn
        except Exception as e:
            try:
                # Fallback: Try without SSL context
                logging.warning(f"SSL connection failed, trying without SSL: {str(e)}")
                conn = pg8000.connect(
                    host=self.connection_params['host'],
                    database=self.connection_params['database'],
                    user=self.connection_params['user'],
                    password=self.connection_params['password'],
                    port=int(self.connection_params['port'])
                )
                return conn
            except Exception as e2:
                logging.error(f"❌ Database connection error (both SSL and non-SSL failed): {str(e2)}")
                raise

    def execute_query(self, query: str, params: tuple = None, fetch: bool = False):
        """Execute a database query with automatic connection management"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, params)
                    if fetch:
                        # Get column names and create dict results
                        columns = [desc[0] for desc in cursor.description]
                        rows = cursor.fetchall()
                        return [dict(zip(columns, row)) for row in rows]
                    conn.commit()
                    return cursor.rowcount
        except Exception as e:
            logging.error(f"❌ Database query error: {str(e)}")
            raise

# Initialize database connection
db = DatabaseConnection()

def get_or_create_user_by_phone(phone_number: str) -> Dict:
    """Get user by phone number, create if doesn't exist"""
    try:
        # First, try to get existing user
        query = """
        SELECT u.id, u.phone_number, u.email, u.name, u.timezone, u.status,
               up.default_personality, up.goggins_intensity, up.check_in_frequency,
               up.reminder_enabled
        FROM users u
        LEFT JOIN user_preferences up ON u.id = up.user_id
        WHERE u.phone_number = %s
        """
        
        result = db.execute_query(query, (phone_number,), fetch=True)
        
        if result:
            user_data = result[0]
            logging.info(f"👤 Found existing user: {phone_number}")
            return {
                'user_id': str(user_data['id']),
                'phone_number': user_data['phone_number'],
                'email': user_data['email'],
                'name': user_data['name'],
                'timezone': user_data['timezone'],
                'status': user_data['status'],
                'default_personality': user_data['default_personality'] or 'goggins',
                'goggins_intensity': user_data['goggins_intensity'] or 'high',
                'check_in_frequency': user_data['check_in_frequency'] or 'daily',
                'reminder_enabled': user_data['reminder_enabled'] if user_data['reminder_enabled'] is not None else True
            }
        
        # Create new user if not found
        user_id = str(uuid.uuid4())
        
        # Insert into users table
        user_query = """
        INSERT INTO users (id, phone_number, status, created_at, last_active)
        VALUES (%s, %s, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """
        db.execute_query(user_query, (user_id, phone_number))
        
        # Insert default preferences
        prefs_query = """
        INSERT INTO user_preferences (user_id, default_personality, goggins_intensity, 
                                    check_in_frequency, reminder_enabled, created_at, updated_at)
        VALUES (%s, 'goggins', 'high', 'daily', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """
        db.execute_query(prefs_query, (user_id,))
        
        logging.info(f"✅ Created new user: {phone_number}")
        
        return {
            'user_id': user_id,
            'phone_number': phone_number,
            'email': None,
            'name': None,
            'timezone': 'UTC',
            'status': 'active',
            'default_personality': 'goggins',
            'goggins_intensity': 'high',
            'check_in_frequency': 'daily',
            'reminder_enabled': True
        }
        
    except Exception as e:
        logging.error(f"❌ Error getting/creating user {phone_number}: {str(e)}")
        raise

def save_incoming_message(user_id: str, content: str, whatsapp_message_id: str = None, 
                         message_relevance: str = 'unknown') -> str:
    """Save incoming user message to conversation history"""
    try:
        message_id = str(uuid.uuid4())
        
        query = """
        INSERT INTO conversation_history 
        (id, user_id, whatsapp_message_id, message_type, content, message_relevance, created_at)
        VALUES (%s, %s, %s, 'incoming', %s, %s, CURRENT_TIMESTAMP)
        """
        
        db.execute_query(query, (message_id, user_id, whatsapp_message_id, content, message_relevance))
        
        logging.info(f"💾 Saved incoming message for user {user_id}")
        return message_id
        
    except Exception as e:
        logging.error(f"❌ Error saving incoming message: {str(e)}")
        raise

def save_outgoing_message(user_id: str, content: str, assistant_personality: str, 
                         processing_time_ms: int = None, azure_openai_request_id: str = None) -> str:
    """Save outgoing bot response to conversation history"""
    try:
        message_id = str(uuid.uuid4())
        
        query = """
        INSERT INTO conversation_history 
        (id, user_id, message_type, content, assistant_personality, processing_time_ms, 
         azure_openai_request_id, message_relevance, created_at)
        VALUES (%s, %s, 'outgoing', %s, %s, %s, %s, 'system', CURRENT_TIMESTAMP)
        """
        
        db.execute_query(query, (message_id, user_id, content, assistant_personality, 
                               processing_time_ms, azure_openai_request_id))
        
        logging.info(f"💾 Saved outgoing message for user {user_id} with personality {assistant_personality}")
        return message_id
        
    except Exception as e:
        logging.error(f"❌ Error saving outgoing message: {str(e)}")
        raise

def get_conversation_context(user_id: str, limit: int = 50) -> List[Dict]:
    """Get recent relevant conversation history for AI context"""
    try:
        query = """
        SELECT message_type, content, assistant_personality, created_at
        FROM conversation_history 
        WHERE user_id = %s 
        ORDER BY created_at DESC 
        LIMIT %s
        """
        
        result = db.execute_query(query, (user_id, limit), fetch=True)
        
        # Convert to list of dicts and reverse to get chronological order
        context = []
        for row in reversed(result):
            context.append({
                'role': 'user' if row['message_type'] == 'incoming' else 'assistant',
                'content': row['content'],
                'personality': row['assistant_personality'],
                'timestamp': row['created_at'].isoformat() if row['created_at'] else None
            })
        
        logging.info(f"📚 Retrieved {len(context)} context messages for user {user_id}")
        return context
        
    except Exception as e:
        logging.error(f"❌ Error getting conversation context: {str(e)}")
        return []

def update_user_session(phone_number: str, current_workflow: str = 'chat') -> bool:
    """Update or create user session for operational state tracking"""
    try:
        # Get user_id from phone number
        user_query = "SELECT id FROM users WHERE phone_number = %s"
        user_result = db.execute_query(user_query, (phone_number,), fetch=True)
        
        if not user_result:
            logging.error(f"❌ User not found for phone {phone_number}")
            return False
            
        user_id = str(user_result[0]['id'])
        
        # Upsert session
        query = """
        INSERT INTO user_sessions (user_id, phone_number, current_workflow, last_message_at, 
                                 expires_at, created_at)
        VALUES (%s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP)
        ON CONFLICT (phone_number) 
        DO UPDATE SET 
            current_workflow = EXCLUDED.current_workflow,
            last_message_at = CURRENT_TIMESTAMP,
            expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days'
        """
        
        db.execute_query(query, (user_id, phone_number, current_workflow))
        
        logging.info(f"🔄 Updated session for {phone_number}")
        return True
        
    except Exception as e:
        logging.error(f"❌ Error updating user session: {str(e)}")
        return False

def classify_message_relevance(content: str) -> str:
    """Classify message relevance for context filtering"""
    content_lower = content.lower()
    
    # Small talk keywords (check first for better accuracy)
    small_talk_keywords = ['hi', 'hello', 'hey', 'thanks', 'thank you', 'bye', 'goodbye', 
                          'how are you', 'good morning', 'good night']
    
    # Accountability keywords  
    accountability_keywords = ['update', 'report', 'status', 'struggling', 
                             'challenge', 'obstacle', 'win', 'success', 'failed', 'completed',
                             'progress', 'check-in', 'checkin']
    
    # Goal-related keywords
    goal_keywords = ['goal', 'target', 'achieve', 'milestone', 'objective', 'fitness goal', 
                    'lose weight', 'gain muscle', 'want to', 'need to', 'plan to', 'pounds']
    
    # Off-topic indicators
    off_topic_indicators = ['weather', 'what is', 'who is', 'search for', 'find me',
                          'how to', 'when did', 'where is']
    
    # Check for small talk first
    if any(keyword in content_lower for keyword in small_talk_keywords):
        return 'small_talk'
    
    # Check for off-topic content
    if any(indicator in content_lower for indicator in off_topic_indicators):
        return 'off_topic'
    
    # Check for accountability content (progress updates, check-ins)
    if any(keyword in content_lower for keyword in accountability_keywords):
        return 'accountability_relevant'
    
    # Check for goal-related content
    if any(keyword in content_lower for keyword in goal_keywords):
        return 'goal_related'
    
    # Default to unknown for manual classification
    return 'unknown'

def update_user_preferences(user_id: str, **preferences) -> bool:
    """Update user preferences"""
    try:
        # Build dynamic update query
        valid_fields = ['default_personality', 'goggins_intensity', 'check_in_frequency', 
                       'reminder_enabled', 'weekend_check_ins', 'ai_memory_enabled']
        
        updates = []
        values = []
        
        for field, value in preferences.items():
            if field in valid_fields:
                updates.append(f"{field} = %s")
                values.append(value)
        
        if not updates:
            return True
        
        values.append(user_id)
        
        query = f"""
        UPDATE user_preferences 
        SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = %s
        """
        
        rows_affected = db.execute_query(query, tuple(values))
        
        logging.info(f"⚙️ Updated preferences for user {user_id}")
        return rows_affected > 0
        
    except Exception as e:
        logging.error(f"❌ Error updating user preferences: {str(e)}")
        return False

# ===== GOAL MANAGEMENT FUNCTIONS =====

def create_user_goal(user_id: str, title: str, description: str = None, category: str = 'general',
                    target_value: float = None, target_unit: str = None, target_date: str = None,
                    priority: str = 'medium', success_criteria: str = None, why_important: str = None,
                    accountability_level: str = 'high') -> str:
    """Create a new goal for the user"""
    try:
        goal_id = str(uuid.uuid4())
        
        query = """
        INSERT INTO goals (id, user_id, title, description, category, target_value, target_unit,
                          target_date, priority, status, success_criteria, why_important, 
                          accountability_level, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', %s, %s, %s, 
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """
        
        # Convert target_date string to date if provided
        target_date_val = target_date if target_date else None
        
        db.execute_query(query, (goal_id, user_id, title, description, category, target_value,
                               target_unit, target_date_val, priority, success_criteria, 
                               why_important, accountability_level))
        
        logging.info(f"🎯 Created goal '{title}' for user {user_id}")
        return goal_id
        
    except Exception as e:
        logging.error(f"❌ Error creating goal: {str(e)}")
        raise

def get_user_goals(user_id: str, status: str = 'active', limit: int = 10) -> List[Dict]:
    """Get user's goals filtered by status"""
    try:
        query = """
        SELECT id, title, description, category, target_value, target_unit, current_value,
               target_date, priority, status, success_criteria, why_important, 
               accountability_level, created_at, updated_at
        FROM goals 
        WHERE user_id = %s AND status = %s
        ORDER BY priority DESC, created_at DESC
        LIMIT %s
        """
        
        result = db.execute_query(query, (user_id, status, limit), fetch=True)
        
        goals = []
        for row in result:
            goals.append({
                'id': str(row['id']),
                'title': row['title'],
                'description': row['description'],
                'category': row['category'],
                'target_value': float(row['target_value']) if row['target_value'] else None,
                'target_unit': row['target_unit'],
                'current_value': float(row['current_value']) if row['current_value'] else 0,
                'target_date': row['target_date'].isoformat() if row['target_date'] else None,
                'priority': row['priority'],
                'status': row['status'],
                'success_criteria': row['success_criteria'],
                'why_important': row['why_important'],
                'accountability_level': row['accountability_level'],
                'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                'progress_percentage': calculate_goal_progress(row['current_value'], row['target_value'])
            })
        
        logging.info(f"🎯 Retrieved {len(goals)} {status} goals for user {user_id}")
        return goals
        
    except Exception as e:
        logging.error(f"❌ Error getting user goals: {str(e)}")
        return []

def update_goal_progress(goal_id: str, current_value: float) -> bool:
    """Update progress on a goal"""
    try:
        query = """
        UPDATE goals 
        SET current_value = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        """
        
        rows_affected = db.execute_query(query, (current_value, goal_id))
        
        logging.info(f"📈 Updated goal {goal_id} progress to {current_value}")
        return rows_affected > 0
        
    except Exception as e:
        logging.error(f"❌ Error updating goal progress: {str(e)}")
        return False

def extract_and_save_goals_from_message(user_id: str, message: str) -> List[str]:
    """Extract potential goals from user message and save them"""
    goals_created = []
    message_lower = message.lower()
    
    try:
        # Goal indicators with extraction patterns
        goal_patterns = [
            # Weight loss goals
            {
                'keywords': ['lose', 'weight', 'pounds', 'lbs', 'kilos', 'kg'],
                'category': 'fitness',
                'extractor': lambda msg: extract_weight_goal(msg)
            },
            # Fitness goals
            {
                'keywords': ['workout', 'gym', 'exercise', 'run', 'marathon', 'muscle'],
                'category': 'fitness',
                'extractor': lambda msg: extract_fitness_goal(msg)
            },
            # Career goals
            {
                'keywords': ['job', 'career', 'promotion', 'business', 'salary'],
                'category': 'career',
                'extractor': lambda msg: extract_career_goal(msg)
            },
            # Learning goals
            {
                'keywords': ['learn', 'study', 'course', 'skill', 'certification'],
                'category': 'learning',
                'extractor': lambda msg: extract_learning_goal(msg)
            }
        ]
        
        for pattern in goal_patterns:
            if any(keyword in message_lower for keyword in pattern['keywords']):
                goal_data = pattern['extractor'](message)
                if goal_data:
                    goal_id = create_user_goal(
                        user_id=user_id,
                        title=goal_data['title'],
                        description=goal_data.get('description'),
                        category=pattern['category'],
                        target_value=goal_data.get('target_value'),
                        target_unit=goal_data.get('target_unit'),
                        target_date=goal_data.get('target_date'),
                        why_important=goal_data.get('why_important')
                    )
                    goals_created.append(goal_id)
        
        return goals_created
        
    except Exception as e:
        logging.error(f"❌ Error extracting goals from message: {str(e)}")
        return []

def extract_weight_goal(message: str) -> Optional[Dict]:
    """Extract weight loss goal from message"""
    import re
    
    # Look for patterns like "lose 20 pounds", "drop 10 lbs", "lose weight"
    weight_patterns = [
        r'lose (\d+)\s*(pounds?|lbs?|kilos?|kg)',
        r'drop (\d+)\s*(pounds?|lbs?|kilos?|kg)',
        r'want to be (\d+)\s*(pounds?|lbs?|kilos?|kg)',
    ]
    
    for pattern in weight_patterns:
        match = re.search(pattern, message.lower())
        if match:
            target_value = float(match.group(1))
            unit = match.group(2)
            
            return {
                'title': f"Lose {target_value} {unit}",
                'description': f"Weight loss goal extracted from: {message[:100]}...",
                'target_value': target_value,
                'target_unit': unit,
                'why_important': "Health and fitness improvement"
            }
    
    # Generic weight loss goal
    if any(word in message.lower() for word in ['lose weight', 'weight loss', 'get fit']):
        return {
            'title': "Weight Loss Goal",
            'description': f"General weight loss goal from: {message[:100]}...",
            'why_important': "Health and fitness improvement"
        }
    
    return None

def extract_fitness_goal(message: str) -> Optional[Dict]:
    """Extract fitness goal from message"""
    message_lower = message.lower()
    
    if 'marathon' in message_lower:
        return {
            'title': "Run a Marathon",
            'description': f"Marathon goal from: {message[:100]}...",
            'target_value': 26.2,
            'target_unit': 'miles'
        }
    elif 'gym' in message_lower or 'workout' in message_lower:
        return {
            'title': "Regular Workout Routine",
            'description': f"Fitness goal from: {message[:100]}..."
        }
    
    return None

def extract_career_goal(message: str) -> Optional[Dict]:
    """Extract career goal from message"""
    return {
        'title': "Career Development",
        'description': f"Career goal from: {message[:100]}..."
    }

def extract_learning_goal(message: str) -> Optional[Dict]:
    """Extract learning goal from message"""
    return {
        'title': "Learning Goal",  
        'description': f"Learning goal from: {message[:100]}..."
    }

def calculate_goal_progress(current_value, target_value) -> float:
    """Calculate goal progress percentage"""
    if not current_value or not target_value:
        return 0.0
    
    try:
        progress = (float(current_value) / float(target_value)) * 100
        return min(progress, 100.0)  # Cap at 100%
    except:
        return 0.0

def get_user_goal_summary(user_id: str) -> str:
    """Get a concise summary of user's active goals for AI context"""
    try:
        goals = get_user_goals(user_id, status='active', limit=5)
        
        if not goals:
            return "No active goals set."
        
        summary_parts = []
        for goal in goals:
            progress_text = ""
            if goal['target_value'] and goal['current_value']:
                progress_text = f" (Progress: {goal['current_value']}/{goal['target_value']} {goal['target_unit'] or ''})"
            
            summary_parts.append(f"- {goal['title']}{progress_text}")
        
        return "Active Goals:\n" + "\n".join(summary_parts)
        
    except Exception as e:
        logging.error(f"❌ Error getting goal summary: {str(e)}")
        return "Unable to retrieve goals."

def ensure_goals_table_exists() -> bool:
    """Ensure the goals table exists with proper schema"""
    try:
        create_table_query = """
        CREATE TABLE IF NOT EXISTS goals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('fitness', 'career', 'learning', 'personal', 'health', 'financial', 'general')),
            target_value NUMERIC(10,2),
            target_unit VARCHAR(50),
            current_value NUMERIC(10,2) DEFAULT 0,
            target_date DATE,
            priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed', 'cancelled')),
            success_criteria TEXT,
            obstacles JSONB,
            why_important TEXT,
            accountability_level VARCHAR(10) DEFAULT 'high' CHECK (accountability_level IN ('low', 'medium', 'high')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP WITH TIME ZONE
        )
        """
        
        db.execute_query(create_table_query)
        
        # Create indexes for better performance
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);",
            "CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);",
            "CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);"
        ]
        
        for index_query in indexes:
            db.execute_query(index_query)
        
        logging.info("✅ Goals table and indexes ensured")
        return True
        
    except Exception as e:
        logging.error(f"❌ Error ensuring goals table: {str(e)}")
        return False

def sync_conversation_to_mem0(user_id: str, message_content: str, message_type: str, 
                             assistant_personality: str = None) -> bool:
    """Sync conversation data to Mem0 for behavioral pattern analysis"""
    try:
        # Import Mem0 service when needed
        from mem0_service import Mem0Service
        
        mem0_service = Mem0Service()
        
        # Create context for Mem0
        context = {
            "timestamp": datetime.now().isoformat(),
            "message_type": message_type,
            "assistant_personality": assistant_personality,
            "session_type": "whatsapp"
        }
        
        # Add to Mem0 for behavioral analysis
        if message_type == "incoming":
            context["intent"] = classify_message_intent(message_content)
            memory_id = mem0_service.add_conversation(
                user_id=user_id,
                message=message_content,
                context=context
            )
        
        logging.info(f"✅ Synced conversation to Mem0: {memory_id}")
        return True
        
    except Exception as e:
        logging.error(f"❌ Failed to sync to Mem0: {str(e)}")
        return False

def classify_message_intent(message: str) -> str:
    """Classify message intent for Mem0 context"""
    message_lower = message.lower()
    
    # Goal-related keywords
    if any(word in message_lower for word in ['goal', 'want to', 'plan to', 'trying to']):
        return "goal_setting"
    
    # Progress-related keywords  
    if any(word in message_lower for word in ['lost', 'gained', 'achieved', 'completed', 'progress']):
        return "progress_update"
    
    # Challenge-related keywords
    if any(word in message_lower for word in ['struggle', 'difficult', 'hard', 'challenge', 'problem']):
        return "challenge_discussion"
    
    # Check-in related
    if any(word in message_lower for word in ['how am i', 'doing with', 'going with']):
        return "check_in"
    
    return "general_conversation"

def get_mem0_enhanced_context(user_id: str, current_message: str) -> dict:
    """Get enhanced context combining PostgreSQL + Mem0 insights"""
    pg_context = {}
    
    try:
        # Get structured data from PostgreSQL
        pg_context = {
            "goals": get_user_goals(user_id, status='active'),
            "recent_progress": get_goal_progress_updates(user_id, days=7),
            "preferences": get_user_preferences(user_id),
            "conversation": get_conversation_context(user_id, limit=5)
        }
        
        # Get behavioral insights from Mem0
        from mem0_service import Mem0Service
        mem0_service = Mem0Service()
        
        mem0_context = mem0_service.get_user_context(
            user_id=user_id,
            query=current_message
        )
        
        # Combine both contexts
        enhanced_context = {
            "structured_data": pg_context,
            "behavioral_insights": mem0_context,
            "hybrid_summary": create_hybrid_summary(pg_context, mem0_context)
        }
        
        return enhanced_context
        
    except Exception as e:
        logging.error(f"❌ Failed to get enhanced context: {str(e)}")
        # Fallback to PostgreSQL only
        return {"structured_data": pg_context, "behavioral_insights": {}, "hybrid_summary": ""}

def create_hybrid_summary(pg_context: dict, mem0_context: dict) -> str:
    """Create a comprehensive summary combining structured and behavioral data"""
    summary_parts = []
    
    # Add goal information
    if pg_context.get("goals"):
        active_goals = [g for g in pg_context["goals"] if g.get("status") == "active"]
        summary_parts.append(f"Active Goals: {len(active_goals)}")
        
        for goal in active_goals[:2]:  # Top 2 goals
            progress = ""
            if goal.get("current_value") and goal.get("target_value"):
                progress = f" ({goal['current_value']}/{goal['target_value']} {goal.get('target_unit', '')})"
            summary_parts.append(f"- {goal['title']}{progress}")
    
    # Add behavioral insights
    if mem0_context.get("context_summary"):
        summary_parts.append(f"Behavioral Pattern: {mem0_context['context_summary']}")
    
    # Add recent progress
    if pg_context.get("recent_progress"):
        summary_parts.append(f"Recent Updates: {len(pg_context['recent_progress'])} this week")
    
    return "; ".join(summary_parts) if summary_parts else "New user interaction"

def implement_conversation_retention_policy(retention_days: int = 90) -> bool:
    """
    Future-ready: Implement conversation retention policy when scaling becomes necessary.
    
    This function will:
    1. Archive conversations older than retention_days to cold storage
    2. Keep Mem0 behavioral insights (never expire)
    3. Maintain recent conversation context for AI
    
    Call this when conversation_history table exceeds comfortable size.
    """
    try:
        # This is a placeholder for future implementation
        # Activate when conversation_history table > 10M rows or performance degrades
        
        logging.info(f"🗄️ Retention policy ready to implement: {retention_days} days")
        
        # Future implementation will:
        # 1. Move old conversations to archive table or cold storage
        # 2. Keep summary metadata for analytics
        # 3. Preserve goal-related conversations longer
        # 4. Maintain Mem0 behavioral insights permanently
        
        return True
        
    except Exception as e:
        logging.error(f"❌ Retention policy error: {str(e)}")
        return False

def get_conversation_storage_metrics() -> dict:
    """Monitor conversation storage growth and performance."""
    try:
        logging.info("🔍 Starting storage metrics query...")
        
        # Get table size metrics using the proper db.execute_query method
        metrics_query = """
        SELECT 
            pg_size_pretty(pg_total_relation_size('conversation_history')) as table_size,
            COUNT(*) as total_messages,
            COUNT(DISTINCT user_id) as unique_users,
            MIN(created_at) as oldest_message,
            MAX(created_at) as newest_message
        FROM conversation_history
        """
        
        logging.info(f"📊 Executing main query...")
        metrics_result = db.execute_query(metrics_query, fetch=True)
        logging.info(f"📈 Query result type: {type(metrics_result)}, value: {metrics_result}")
        
        if metrics_result is None:
            return {"error": "Query returned None - database connection issue"}
            
        if not metrics_result or len(metrics_result) == 0:
            return {"error": "No data found in conversation_history table"}
            
        metrics = metrics_result[0]
        logging.info(f"📋 Parsed metrics: {metrics}")
        
        # Calculate growth rate  
        recent_query = """
        SELECT COUNT(*) as recent_messages
        FROM conversation_history 
        WHERE created_at > NOW() - INTERVAL '30 days'
        """
        
        logging.info(f"📅 Executing growth query...")
        recent_result = db.execute_query(recent_query, fetch=True)
        logging.info(f"📊 Growth result: {recent_result}")
        
        recent_messages = 0
        if recent_result and len(recent_result) > 0:
            recent_messages = recent_result[0].get('recent_messages', 0)
        
        return {
            "table_size": metrics.get('table_size', 'Unknown'),
            "total_messages": metrics.get('total_messages', 0),
            "unique_users": metrics.get('unique_users', 0),
            "oldest_message": str(metrics.get('oldest_message')) if metrics.get('oldest_message') else None,
            "newest_message": str(metrics.get('newest_message')) if metrics.get('newest_message') else None,
            "recent_messages_30d": recent_messages,
            "retention_needed": metrics.get('total_messages', 0) > 10_000_000,  # 10M message threshold
            "performance_monitoring": True
        }
                
    except Exception as e:
        logging.error(f"❌ Storage metrics error: {str(e)}")
        import traceback
        logging.error(f"❌ Full traceback: {traceback.format_exc()}")
        return {"error": str(e)}

def archive_old_conversations(cutoff_days: int = 90) -> dict:
    """
    Archive conversations older than cutoff_days.
    Call this when storage optimization becomes necessary.
    """
    try:
        # Count messages to be archived using proper db.execute_query method
        query = """
        SELECT COUNT(*) as messages_to_archive 
        FROM conversation_history 
        WHERE created_at < NOW() - INTERVAL %s
        """
        
        result = db.execute_query(query, (f"{cutoff_days} days",), fetch=True)
        
        if not result:
            return {"error": "Could not query conversation history"}
            
        messages_to_archive = result[0]['messages_to_archive']
        
        if messages_to_archive == 0:
            return {"archived": 0, "message": "No old messages to archive"}
        
        # For now, just log what would be archived
        # Future implementation will move to archive table or cold storage
        logging.info(f"📦 Would archive {messages_to_archive} messages older than {cutoff_days} days")
        
        return {
            "messages_to_archive": messages_to_archive,
            "cutoff_date": f"{cutoff_days} days ago",
            "action": "simulation_only",
            "ready_to_implement": True
        }
                
    except Exception as e:
        logging.error(f"❌ Archive simulation error: {str(e)}")
        return {"error": str(e)}

def get_user_preferences(user_id: str) -> dict:
    """Get user preferences for AI context"""
    try:
        query = """
        SELECT default_personality, goggins_intensity, check_in_frequency, reminder_enabled,
               weekend_check_ins, ai_memory_enabled
        FROM user_preferences 
        WHERE user_id = %s
        """
        
        result = db.execute_query(query, (user_id,), fetch=True)
        
        if result:
            prefs = result[0]
            return {
                'default_personality': prefs['default_personality'],
                'goggins_intensity': prefs['goggins_intensity'],
                'check_in_frequency': prefs['check_in_frequency'],
                'reminder_enabled': prefs['reminder_enabled'],
                'weekend_check_ins': prefs.get('weekend_check_ins', True),
                'ai_memory_enabled': prefs.get('ai_memory_enabled', True)
            }
        
        # Return defaults if no preferences found
        return {
            'default_personality': 'goggins',
            'goggins_intensity': 'high',
            'check_in_frequency': 'daily',
            'reminder_enabled': True,
            'weekend_check_ins': True,
            'ai_memory_enabled': True
        }
        
    except Exception as e:
        logging.error(f"❌ Error getting user preferences: {str(e)}")
        return {}

def get_goal_progress_updates(user_id: str, days: int = 7) -> List[Dict]:
    """Get recent goal progress updates for context"""
    try:
        query = """
        SELECT id, title, current_value, target_value, target_unit, updated_at
        FROM goals 
        WHERE user_id = %s 
        AND updated_at > NOW() - INTERVAL %s
        AND status = 'active'
        ORDER BY updated_at DESC
        """
        
        result = db.execute_query(query, (user_id, f"{days} days"), fetch=True)
        
        updates = []
        for row in result:
            updates.append({
                'goal_id': str(row['id']),
                'title': row['title'],
                'current_value': float(row['current_value']) if row['current_value'] else 0,
                'target_value': float(row['target_value']) if row['target_value'] else None,
                'target_unit': row['target_unit'],
                'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None,
                'progress_percentage': calculate_goal_progress(row['current_value'], row['target_value'])
            })
        
        return updates
        
    except Exception as e:
        logging.error(f"❌ Error getting goal progress updates: {str(e)}")
        return [] 