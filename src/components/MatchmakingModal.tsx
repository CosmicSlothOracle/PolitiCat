import React from 'react';

export interface MatchmakingSlot {
  name: string;
  connected: boolean;
  isAI: boolean;
}

interface MatchmakingModalProps {
  isOpen: boolean;
  isHost: boolean;
  roomId: string;
  slotsCount: number;
  slots: MatchmakingSlot[];
  allowedCounts?: number[]; // which slot counts to offer
  onChangeSlotsCount: (count: number) => void;
  onFillAI: (slotIndex: number) => void;
  onKickAI: (slotIndex: number) => void;
  onStart: () => void;
  onClose: () => void;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  isHost,
  roomId,
  slotsCount,
  slots,
  onChangeSlotsCount,
  allowedCounts = [2,3,4],
  onFillAI,
  onKickAI,
  onStart,
  onClose,
}) => {
  if (!isOpen) return null;

  const allFilled = slots.slice(0, slotsCount).every(s => s.connected || s.isAI);

  return (
    <div className="matchmaking-overlay" role="dialog" aria-modal="true">
      <div className="matchmaking-modal">
        <div className="mm-header">
          <h3>Matchmaking</h3>
          <button className="close-button" onClick={onClose} aria-label="Close matchmaking">×</button>
        </div>
        <div className="mm-room">Room: <span className="room-code">{roomId || '—'}</span></div>

        {isHost && (
          <div className="mm-slots-config">
            <span>Slots: </span>
            {allowedCounts.map(n => (
              <button
                key={n}
                className={`play-button ${n === slotsCount ? '' : ''}`}
                onClick={() => isHost && onChangeSlotsCount(n)}
                disabled={!isHost}
                aria-disabled={!isHost}
                title={!isHost ? 'Only host can change slots' : undefined}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        <div className="mm-slots">
          {Array.from({ length: slotsCount }).map((_, idx) => {
            const slot = slots[idx];
            const isFilled = !!slot && (slot.connected || slot.isAI);
            return (
              <div className="mm-slot" key={idx}>
                <div className="mm-slot-title">{`Slot ${idx + 1}`}</div>
                <div className="mm-slot-body">
                  {isFilled ? (
                    <>
                      <div className="mm-name">{slot.name}</div>
                      <div className={`mm-status ${slot.isAI ? 'ai' : (slot.connected ? 'ok' : 'wait')}`}>
                        {slot.isAI ? 'AI' : (slot.connected ? 'Connected' : 'Waiting')}
                      </div>
                      {slot.isAI && (
                        <button className="play-button" onClick={() => { if(isHost) onKickAI(idx); }} disabled={!isHost} aria-disabled={!isHost} title={!isHost ? 'Only host can remove AI' : undefined}>Remove AI</button>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mm-name">—</div>
                      <div className="mm-status wait">Waiting…</div>
                      <button className="play-button" onClick={() => { if(isHost) onFillAI(idx); }} disabled={!isHost} aria-disabled={!isHost} title={!isHost ? 'Only host can add AI' : undefined}>Fill with AI</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mm-actions">
          {isHost && (
            <button
              className={`play-button ${(!allFilled) ? 'disabled' : ''}`}
              onClick={onStart}
              disabled={!allFilled}
            >
              Start
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchmakingModal;


