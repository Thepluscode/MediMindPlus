import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Video, { Room, LocalTrack, RemoteTrack } from 'twilio-video';
import { videoService } from '../../services/video';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from 'lucide-react';
import logger from '../../utils/logger';

export default function VideoRoomPage() {
    const { consultationId } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState<Room | null>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const localVideoRef = useRef<HTMLDivElement>(null);
    const remoteVideoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (consultationId) {
            joinRoom();
        }
        return () => {
            leaveRoom();
        };
    }, [consultationId]);

    const joinRoom = async () => {
        try {
            if (!consultationId) return;
            const { token } = await videoService.getToken(consultationId);

            const newRoom = await Video.connect(token, {
                name: `consultation-${consultationId}`,
                audio: true,
                video: { width: 640 }
            });

            setRoom(newRoom);

            // Handle local participant
            handleParticipant(newRoom.localParticipant, localVideoRef);

            // Handle existing participants
            newRoom.participants.forEach(participant => {
                handleParticipant(participant, remoteVideoRef);
            });

            // Handle new participants
            newRoom.on('participantConnected', participant => {
                handleParticipant(participant, remoteVideoRef);
            });

            newRoom.on('participantDisconnected', participant => {
                // Handle disconnect logic (remove video)
                // For MVP assume 1-on-1 and just clear remote ref if needed or rely on React state
                logger.info('Participant disconnected', {
                    service: 'video-consultation',
                    consultationId,
                    participantIdentity: participant.identity
                });
            });

        } catch (error) {
            logger.error('Failed to connect to video room', {
                service: 'video-consultation',
                consultationId,
                error: error instanceof Error ? error.message : String(error)
            });
            alert('Failed to join video room.');
            navigate('/dashboard');
        }
    };

    const handleParticipant = (participant: any, containerRef: React.RefObject<HTMLDivElement>) => {
        participant.tracks.forEach((publication: any) => {
            if (publication.isSubscribed) {
                const track = publication.track;
                containerRef.current?.appendChild(track.attach());
            }
        });

        participant.on('trackSubscribed', (track: any) => {
            containerRef.current?.appendChild(track.attach());
        });
    };

    const leaveRoom = () => {
        room?.disconnect();
        setRoom(null);
    };

    const toggleAudio = () => {
        room?.localParticipant.audioTracks.forEach(publication => {
            if (isAudioEnabled) publication.track.disable();
            else publication.track.enable();
        });
        setIsAudioEnabled(!isAudioEnabled);
    };

    const toggleVideo = () => {
        room?.localParticipant.videoTracks.forEach(publication => {
            if (isVideoEnabled) publication.track.disable();
            else publication.track.enable();
        });
        setIsVideoEnabled(!isVideoEnabled);
    };

    const handleEndCall = () => {
        leaveRoom();
        navigate('/dashboard');
        // Ideally show a "Rate Review" modal/page here
    };

    return (
        <div className="h-screen bg-gray-900 flex flex-col">
            <div className="flex-1 relative">
                {/* Remote Video (Full Screen) */}
                <div ref={remoteVideoRef} className="absolute inset-0 w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

                {/* Local Video (Floating) */}
                <div ref={localVideoRef} className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

                {/* Controls */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
                    <button onClick={toggleAudio} className={`p-4 rounded-full ${isAudioEnabled ? 'bg-gray-700' : 'bg-red-500'} text-white hover:opacity-80`}>
                        {isAudioEnabled ? <Mic /> : <MicOff />}
                    </button>
                    <button onClick={toggleVideo} className={`p-4 rounded-full ${isVideoEnabled ? 'bg-gray-700' : 'bg-red-500'} text-white hover:opacity-80`}>
                        {isVideoEnabled ? <VideoIcon /> : <VideoOff />}
                    </button>
                    <button onClick={handleEndCall} className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700">
                        <PhoneOff />
                    </button>
                </div>
            </div>
        </div>
    );
}
