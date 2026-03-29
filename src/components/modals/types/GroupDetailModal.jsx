import { useEffect, useState, useCallback } from "react";
import { Group } from "@/entities/Group";
import { User } from "@/entities/User";

export default function GroupDetailModal({ data }) {
  const [me, setMe] = useState(null);
  const [members, setMembers] = useState(data?.members || []);

  useEffect(() => {
    User.me().then(setMe).catch(() => setMe(null));
    setMembers(data?.members || []);
  }, [data]);

  const isMember = me && members.includes(me.email);

  const toggleMembership = useCallback(async () => {
    if (!me || !data?.id) return;
    const next = isMember ? members.filter(e => e !== me.email) : [...members, me.email];
    await Group.update(data.id, { members: next });
    setMembers(next);
  }, [me, data, isMember, members]);

  return (
    <div>
      {data?.cover_image_url && <img src={data.cover_image_url} alt={data?.name} className="w-full h-56 object-cover" />}
      <div className="p-4 sm:p-6">
        <h3 className="text-white text-xl font-bold mb-2">{data?.name}</h3>
        {data?.description && <p className="text-zinc-300 mb-4">{data.description}</p>}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMembership}
            className={`px-4 py-2 rounded-full text-sm ${isMember ? "bg-zinc-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
          >
            {isMember ? "Verlassen" : "Beitreten"}
          </button>
          <span className="text-zinc-400 text-sm">{members.length} Mitglieder</span>
        </div>
      </div>
    </div>
  );
}