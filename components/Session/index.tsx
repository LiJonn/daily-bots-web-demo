import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LineChart, Loader2, LogOut, Settings, StopCircle } from "lucide-react";
import {
  PipecatMetrics,
  TransportState,
  VoiceClientConfigOption,
  VoiceEvent,
} from "realtime-ai";
import { useVoiceClient, useVoiceClientEvent } from "realtime-ai-react";

import StatsAggregator from "../../utils/stats_aggregator";
import { Configure } from "../Setup";
import { Button } from "../ui/button";
import * as Card from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

import Agent from "./Agent";
import Stats from "./Stats";
import UserMicBubble from "./UserMicBubble";
import Checklist from "./Checklist";

let stats_aggregator: StatsAggregator;

interface SessionProps {
  state: TransportState;
  onLeave: () => void;
  openMic?: boolean;
  startAudioOff?: boolean;
}

export const Session = React.memo(
  ({ state, onLeave, startAudioOff = false }: SessionProps) => {
    const voiceClient = useVoiceClient()!;
    const [hasStarted, setHasStarted] = useState<boolean>(false);
    const [showConfig, setShowConfig] = useState<boolean>(false);
    const [showStats, setShowStats] = useState<boolean>(false);
    const [muted, setMuted] = useState(startAudioOff);
    const [runtimeConfigUpdate, setRuntimeConfigUpdate] = useState<
      VoiceClientConfigOption[] | null
    >(null);
    const [updatingConfig, setUpdatingConfig] = useState<boolean>(false);

    const modalRef = useRef<HTMLDialogElement>(null);

    const [userResponses, setUserResponses] = useState({
      name: '',
      isNameChecked: false,

      prescriptions: '',
      allergies: '',
      medicalConditions: '',
      reasonsForVisit: '',
    });

    //const bingSoundRef = useRef<HTMLAudioElement>(null);
    //const bongSoundRef = useRef<HTMLAudioElement>(null);

    // ---- Voice Client Events

    useVoiceClientEvent(
      VoiceEvent.BotTranscript,
      useCallback((transcript: any) => {
        console.log("Agent said:", transcript); // Log the entire transcript object from agent
      }, [])
    );

    useVoiceClientEvent(
      VoiceEvent.UserTranscript,
      useCallback((transcript: any) => {
        if (transcript.final) { // Only process if the transcript is final
          console.log("Final User Transcript:", transcript.text);

          const lowerCasedTranscript = transcript.text.toLowerCase();

          // Check if "name" is mentioned in the sentence
          if (lowerCasedTranscript.includes("name")) {
            // Split the sentence into words and take the last word as the name
            const words = transcript.text.split(" ");
            const lastWord = words[words.length - 1].replace(/[.,!?]/g, "").trim(); // Get the last word and remove punctuation

            if (lastWord) {
              setUserResponses((prevState) => ({
                ...prevState,
                name: lastWord,
                isNameChecked: true, // Mark the name field as checked
              }));
              console.log("User's name is:", lastWord);
            } else {
              console.error("Name extraction failed: No valid name found.");
            }
          }

          // Additional logic for handling other final user responses
        }
      }, [])
    );

    useVoiceClientEvent(
      VoiceEvent.Metrics,
      useCallback((metrics: PipecatMetrics) => {
        metrics?.ttfb?.map((m: { processor: string; value: number }) => {
          stats_aggregator.addStat([m.processor, "ttfb", m.value, Date.now()]);
        });
      }, [])
    );

    useVoiceClientEvent(
      VoiceEvent.BotStoppedSpeaking,
      useCallback(() => {
        if (hasStarted) return;

        /*if (bingSoundRef.current) {
          bingSoundRef.current.volume = 0.5;
          bingSoundRef.current.play();
        }*/
        setHasStarted(true);
      }, [hasStarted])
    );

    useVoiceClientEvent(
      VoiceEvent.UserStoppedSpeaking,
      useCallback(() => {
        /*if (bongSoundRef.current) {
          bongSoundRef.current.volume = 0.5;
          bongSoundRef.current.play();
        }*/

        if (hasStarted) return;
        setHasStarted(true);
      }, [hasStarted])
    );

    // ---- Effects

    useEffect(() => {
      // Reset started state on mount
      setHasStarted(false);
    }, []);

    useEffect(() => {
      // If we joined unmuted, enable the mic once in ready state
      if (!hasStarted || startAudioOff) return;
      voiceClient.enableMic(true);
    }, [voiceClient, startAudioOff, hasStarted]);

    useEffect(() => {
      // Create new stats aggregator on mount (removes stats from previous session)
      stats_aggregator = new StatsAggregator();
    }, []);

    useEffect(() => {
      // Leave the meeting if there is an error
      if (state === "error") {
        onLeave();
      }
    }, [state, onLeave]);

    useEffect(() => {
      // Modal effect
      // Note: backdrop doesn't currently work with dialog open, so we use setModal instead
      const current = modalRef.current;

      if (current && showConfig) {
        current.inert = true;
        current.showModal();
        current.inert = false;
      }
      return () => current?.close();
    }, [showConfig]);

    const onConfigUpdate = useCallback((config: VoiceClientConfigOption[]) => {
      setRuntimeConfigUpdate(config);
    }, []);

    function toggleMute() {
      voiceClient.enableMic(muted);
      setMuted(!muted);
    }

    return (
      <>
        <dialog ref={modalRef}>
          <Card.Card className="w-svw max-w-full md:max-w-md lg:max-w-lg">
            <Card.CardHeader>
              <Card.CardTitle>Configuration</Card.CardTitle>
            </Card.CardHeader>
            <Card.CardContent>
              <Configure
                state={state}
                inSession={true}
                handleConfigUpdate={onConfigUpdate}
              />
            </Card.CardContent>
            <Card.CardFooter isButtonArray>
              <Button variant="outline" onClick={() => setShowConfig(false)}>
                Cancel
              </Button>
              <Button
                variant="success"
                disabled={updatingConfig || runtimeConfigUpdate === null}
                onClick={async () => {
                  if (!runtimeConfigUpdate) return;
                  setUpdatingConfig(true);
                  await voiceClient.updateConfig(runtimeConfigUpdate);
                  // On update, reset state
                  setUpdatingConfig(false);
                  setRuntimeConfigUpdate(null);
                  setShowConfig(false);
                }}
              >
                {updatingConfig && <Loader2 className="animate-spin" />}
                {updatingConfig ? "Updating..." : "Save Changes"}
              </Button>
            </Card.CardFooter>
          </Card.Card>
        </dialog>

        {showStats &&
          createPortal(
            <Stats
              statsAggregator={stats_aggregator}
              handleClose={() => setShowStats(false)}
            />,
            document.getElementById("tray")!
          )}

        <div className="flex items-center justify-center w-full h-screen gap-8">
          <div className="flex-1 flex flex-col items-center justify-center max-w-[420px]">
            <Card.Card
              fullWidthMobile={false}
              className="w-full mt-auto shadow-long"
            >
              <Agent
                isReady={state === "ready"}
                statsAggregator={stats_aggregator}
              />
            </Card.Card>
            <UserMicBubble
              active={hasStarted}
              muted={muted}
              handleMute={() => toggleMute()}
            />
          </div>

          <div className="flex-shrink-0 max-w-[320px]">
            <Checklist userResponses={userResponses} />
          </div>
        </div>



        <footer className="w-full flex flex-row mt-auto self-end md:w-auto">
          <div className="flex flex-row justify-between gap-3 w-full md:w-auto">
            <Tooltip>
              <TooltipContent>Interrupt bot</TooltipContent>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    voiceClient.action({
                      service: "tts",
                      action: "interrupt",
                      arguments: [],
                    });
                  }}
                >
                  <StopCircle />
                </Button>
              </TooltipTrigger>
            </Tooltip>

            <Tooltip>
              <TooltipContent>Show bot statistics panel</TooltipContent>
              <TooltipTrigger asChild>
                <Button
                  variant={showStats ? "light" : "ghost"}
                  size="icon"
                  onClick={() => setShowStats(!showStats)}
                >
                  <LineChart />
                </Button>
              </TooltipTrigger>
            </Tooltip>
            <Tooltip>
              <TooltipContent>Configure</TooltipContent>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setRuntimeConfigUpdate(null);
                    setShowConfig(true);
                  }}
                >
                  <Settings />
                </Button>
              </TooltipTrigger>
            </Tooltip>
            <Button onClick={() => onLeave()} className="ml-auto">
              <LogOut size={16} />
              End
            </Button>
          </div>
        </footer>
        {/*audio ref={bingSoundRef} src="/bing.wav" />
        <audio ref={bongSoundRef} src="/bong.wav" /> */}
      </>
    );
  },
  (p, n) => p.state === n.state
);

Session.displayName = "Session";

export default Session;
