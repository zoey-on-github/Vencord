/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 rini
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findStoreLazy } from "@webpack";
import { Message, User } from "discord-types/general";
interface UsernameProps {
    author: { nick: string; };
    message: Message;
    withMentionPrefix?: boolean;
    isRepliedMessage: boolean;
    userOverride?: User;
}
const settings = definePluginSettings({
    mode: {
        type: OptionType.SELECT,
        description: "How to display usernames and nicks",
        options: [
            { label: "Username then nickname", value: "user-nick", default: true },
            { label: "Nickname then username", value: "nick-user" },
            { label: "Username only", value: "user" },
        ],
    },
    displayNames: {
        type: OptionType.BOOLEAN,
        description: "Use display names in place of usernames",
        default: false
    },
    inReplies: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Also apply functionality to reply previews",
    },
});
const StreamerMode = findStoreLazy("StreamerModeStore");
export default definePlugin({
    name: "ShowMeYourName",
    description: "Display usernames next to nicks, or no nicks at all",
    authors: [Devs.Rini, Devs.TheKodeToad],
    patches: [
        {
            find: ".useCanSeeRemixBadge)",
            replacement: {
                match: /(?<=onContextMenu:\i,children:).*?\}/,
                replace: "$self.renderUsername(arguments[0])}"
            }
        },
    ],
    settings,


    renderUsername: ({ author, message, isRepliedMessage, withMentionPrefix, userOverride }: UsernameProps) => {
        try {
            const user = userOverride ?? message.author;
            let { username } = user;
            if (settings.store.displayNames)
                username = (user as any).globalName || username;

            const { nick } = author;
            const prefix = withMentionPrefix ? "@" : "";
            if (username === nick || isRepliedMessage && !settings.store.inReplies)
                return prefix + nick;
            if (settings.store.mode === "user-nick")
                if (StreamerMode.enabled) {
                    return <>{prefix}{username[0]}... <span className="vc-smyn-suffix">{nick}</span></>;
                } else {
                    return <>{prefix}{username} <span className="vc-smyn-suffix">{nick}</span></>;
                }
            if (settings.store.mode === "nick-user")
                if (StreamerMode.enabled) {
                    return <>{prefix}{nick} <span className="vc-smyn-suffix">{username[0]}...</span></>;
                } else {
                    return <>{prefix}{nick} <span className="vc-smyn-suffix">{username}</span></>;
                }
            if (StreamerMode.enabled) {
                return prefix + username[0] + "...";
            } else {
                return prefix + username;
            }
        } catch {
            return author?.nick;
        }
    },
});
