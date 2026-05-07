use std::collections::HashSet;
use std::sync::OnceLock;

use regex::Regex;

use crate::models::metrics::ActivityCategory;

static EDIT_TOOLS: OnceLock<HashSet<&'static str>> = OnceLock::new();
static READ_TOOLS: OnceLock<HashSet<&'static str>> = OnceLock::new();
static BASH_TOOLS: OnceLock<HashSet<&'static str>> = OnceLock::new();
static TASK_TOOLS: OnceLock<HashSet<&'static str>> = OnceLock::new();
static SEARCH_TOOLS: OnceLock<HashSet<&'static str>> = OnceLock::new();

static RE_TEST: OnceLock<Regex> = OnceLock::new();
static RE_GIT: OnceLock<Regex> = OnceLock::new();
static RE_BUILD: OnceLock<Regex> = OnceLock::new();
static RE_DEBUG: OnceLock<Regex> = OnceLock::new();
static RE_FEATURE: OnceLock<Regex> = OnceLock::new();
static RE_REFACTOR: OnceLock<Regex> = OnceLock::new();
static RE_BRAINSTORM: OnceLock<Regex> = OnceLock::new();

fn edit_tools() -> &'static HashSet<&'static str> {
    EDIT_TOOLS.get_or_init(|| {
        ["Edit", "Write", "FileEditTool", "FileWriteTool", "NotebookEdit", "cursor:edit"]
            .into_iter()
            .collect()
    })
}

fn read_tools() -> &'static HashSet<&'static str> {
    READ_TOOLS.get_or_init(|| {
        ["Read", "Grep", "Glob", "FileReadTool", "GrepTool", "GlobTool"]
            .into_iter()
            .collect()
    })
}

fn bash_tools() -> &'static HashSet<&'static str> {
    BASH_TOOLS.get_or_init(|| {
        ["Bash", "BashTool", "PowerShellTool", "PowerShell"]
            .into_iter()
            .collect()
    })
}

fn task_tools() -> &'static HashSet<&'static str> {
    TASK_TOOLS.get_or_init(|| {
        [
            "TaskCreate", "TaskUpdate", "TaskGet", "TaskList", "TaskOutput", "TaskStop",
            "TodoWrite",
        ]
        .into_iter()
        .collect()
    })
}

fn search_tools() -> &'static HashSet<&'static str> {
    SEARCH_TOOLS.get_or_init(|| {
        ["WebSearch", "WebFetch", "ToolSearch"].into_iter().collect()
    })
}

fn re_test() -> &'static Regex {
    RE_TEST.get_or_init(|| {
        Regex::new(r"(?i)\b(test|pytest|vitest|jest|mocha|spec|coverage|npm\s+test|npx\s+vitest|npx\s+jest)\b").unwrap()
    })
}

fn re_git() -> &'static Regex {
    RE_GIT.get_or_init(|| {
        Regex::new(r"(?i)\bgit\s+(push|pull|commit|merge|rebase|checkout|branch|stash|log|diff|status|add|reset|cherry-pick|tag)\b").unwrap()
    })
}

fn re_build() -> &'static Regex {
    RE_BUILD.get_or_init(|| {
        Regex::new(r"(?i)\b(npm\s+run\s+build|npm\s+publish|pip\s+install|docker|deploy|make\s+build|npm\s+run\s+dev|npm\s+start|pm2|systemctl|brew|cargo\s+build)\b").unwrap()
    })
}

fn re_debug() -> &'static Regex {
    RE_DEBUG.get_or_init(|| {
        Regex::new(r"(?i)\b(fix|bug|error|broken|failing|crash|issue|debug|traceback|exception|stack\s*trace|not\s+working|wrong|unexpected|status\s+code|404|500|401|403)\b").unwrap()
    })
}

fn re_feature() -> &'static Regex {
    RE_FEATURE.get_or_init(|| {
        Regex::new(r"(?i)\b(add|create|implement|new|build|feature|introduce|set\s*up|scaffold|generate|make\s+(?:a|me|the)|write\s+(?:a|me|the))\b").unwrap()
    })
}

fn re_refactor() -> &'static Regex {
    RE_REFACTOR.get_or_init(|| {
        Regex::new(r"(?i)\b(refactor|clean\s*up|rename|reorganize|simplify|extract|restructure|move|migrate|split)\b").unwrap()
    })
}

fn re_brainstorm() -> &'static Regex {
    RE_BRAINSTORM.get_or_init(|| {
        Regex::new(r"(?i)\b(brainstorm|idea|what\s+if|explore|think\s+about|approach|strategy|design|consider|how\s+should|what\s+would|opinion|suggest|recommend)\b").unwrap()
    })
}

fn has_any(tool_names: &[&str], set: &HashSet<&'static str>) -> bool {
    tool_names.iter().any(|t| set.contains(*t))
}

fn has_mcp(tool_names: &[&str]) -> bool {
    tool_names.iter().any(|t| t.starts_with("mcp__"))
}

fn refine_coding(user_message: &str) -> ActivityCategory {
    if re_debug().is_match(user_message) {
        return ActivityCategory::Debugging;
    }
    if re_refactor().is_match(user_message) {
        return ActivityCategory::Refactoring;
    }
    if re_feature().is_match(user_message) {
        return ActivityCategory::Feature;
    }
    ActivityCategory::Coding
}

fn classify_bash_only(user_message: &str) -> ActivityCategory {
    if re_test().is_match(user_message) {
        return ActivityCategory::Testing;
    }
    if re_git().is_match(user_message) {
        return ActivityCategory::Git;
    }
    if re_build().is_match(user_message) {
        return ActivityCategory::BuildDeploy;
    }
    ActivityCategory::Coding
}

fn classify_edit_and_bash(user_message: &str) -> ActivityCategory {
    if re_test().is_match(user_message) {
        return ActivityCategory::Testing;
    }
    if re_git().is_match(user_message) {
        return ActivityCategory::Git;
    }
    if re_build().is_match(user_message) {
        return ActivityCategory::BuildDeploy;
    }
    ActivityCategory::Coding
}

fn stage3_fallback(user_message: &str) -> ActivityCategory {
    if user_message.is_empty() {
        return ActivityCategory::General;
    }
    if re_brainstorm().is_match(user_message) {
        return ActivityCategory::Brainstorming;
    }
    if re_debug().is_match(user_message) {
        return ActivityCategory::Debugging;
    }
    if re_feature().is_match(user_message) {
        return ActivityCategory::Feature;
    }
    if re_refactor().is_match(user_message) {
        return ActivityCategory::Refactoring;
    }
    if re_test().is_match(user_message) {
        return ActivityCategory::Testing;
    }
    if re_git().is_match(user_message) {
        return ActivityCategory::Git;
    }
    if re_build().is_match(user_message) {
        return ActivityCategory::BuildDeploy;
    }
    ActivityCategory::Conversation
}

pub fn classify_turn(tool_names: &[&str], user_message: &str) -> ActivityCategory {
    let edits = edit_tools();
    let reads = read_tools();
    let bashes = bash_tools();
    let tasks = task_tools();
    let searches = search_tools();

    if tool_names.contains(&"EnterPlanMode") {
        return ActivityCategory::Planning;
    }

    if tool_names.contains(&"Agent") {
        return ActivityCategory::Delegation;
    }

    let has_edit = has_any(tool_names, edits);
    let has_bash = has_any(tool_names, bashes);

    if has_edit && has_bash {
        let candidate = classify_edit_and_bash(user_message);
        return if candidate == ActivityCategory::Coding {
            refine_coding(user_message)
        } else {
            candidate
        };
    }

    if has_edit {
        return refine_coding(user_message);
    }

    if has_bash {
        return classify_bash_only(user_message);
    }

    if has_any(tool_names, searches) || has_mcp(tool_names) {
        return ActivityCategory::Exploration;
    }

    if has_any(tool_names, reads) {
        let candidate = ActivityCategory::Exploration;
        if re_debug().is_match(user_message) {
            return ActivityCategory::Debugging;
        }
        return candidate;
    }

    if has_any(tool_names, tasks) {
        return ActivityCategory::Planning;
    }

    if tool_names.contains(&"Skill") {
        return ActivityCategory::General;
    }

    stage3_fallback(user_message)
}

pub fn count_retries(tool_names: &[&str]) -> u32 {
    let edits = edit_tools();
    let bashes = bash_tools();

    let mut retries = 0u32;
    let len = tool_names.len();
    let mut i = 0usize;

    while i + 2 < len {
        if edits.contains(tool_names[i])
            && bashes.contains(tool_names[i + 1])
            && edits.contains(tool_names[i + 2])
        {
            retries += 1;
            i += 3;
        } else {
            i += 1;
        }
    }

    retries
}

#[cfg(test)]
mod tests {
    use super::*;
    use ActivityCategory::*;

    #[test]
    fn edit_only_is_coding() {
        let result = classify_turn(&["Edit"], "update the function signature");
        assert_eq!(result, Coding);
    }

    #[test]
    fn bash_git_command_is_git() {
        let result = classify_turn(&["Bash"], "git commit -m 'fix typo'");
        assert_eq!(result, Git);
    }

    #[test]
    fn agent_tool_is_delegation() {
        let result = classify_turn(&["Agent", "Edit"], "delegate this task");
        assert_eq!(result, Delegation);
    }

    #[test]
    fn debug_keyword_refines_coding_to_debugging() {
        let result = classify_turn(&["Edit"], "fix the bug in the parser");
        assert_eq!(result, Debugging);
    }

    #[test]
    fn no_tools_brainstorm_keyword() {
        let result = classify_turn(&[], "brainstorm some ideas for the new feature");
        assert_eq!(result, Brainstorming);
    }

    #[test]
    fn retry_count_edit_bash_edit() {
        let tools = ["Edit", "Bash", "Edit"];
        assert_eq!(count_retries(&tools), 1);
    }

    #[test]
    fn retry_count_two_sequences() {
        let tools = ["Edit", "Bash", "Edit", "Write", "BashTool", "FileEditTool"];
        assert_eq!(count_retries(&tools), 2);
    }

    #[test]
    fn no_tools_empty_message_is_general() {
        let result = classify_turn(&[], "");
        assert_eq!(result, General);
    }

    #[test]
    fn mcp_tool_is_exploration() {
        let result = classify_turn(&["mcp__context7__search"], "look something up");
        assert_eq!(result, Exploration);
    }

    #[test]
    fn enter_plan_mode_is_planning() {
        let result = classify_turn(&["EnterPlanMode"], "");
        assert_eq!(result, Planning);
    }

    #[test]
    fn edit_bash_with_test_keyword_is_testing() {
        let result = classify_turn(&["Edit", "Bash"], "run vitest to check coverage");
        assert_eq!(result, Testing);
    }

    #[test]
    fn read_only_with_debug_keyword_is_debugging() {
        let result = classify_turn(&["Read"], "find the error in the logs");
        assert_eq!(result, Debugging);
    }

    #[test]
    fn refactor_keyword_refines_coding() {
        let result = classify_turn(&["Write"], "refactor this module");
        assert_eq!(result, Refactoring);
    }
}
