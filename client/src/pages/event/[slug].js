import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getEvent } from '../../actions/event';
import Layout from '../../components/layout';
import Loading from '../../components/loading';
import io from 'socket.io-client';
import styles from '../../styles/eventDetail.module.scss';
import BookingCheckout from '../../components/checkout';
import apiEndpoint from '../../config/apiConfig';
import { checkAuthentication } from '../../auth';
import Footer from '../../components/footer';

const Event = ({ slug, user }) => {
  const router = useRouter();
  const socket = useRef(null);
  const eventRoom = `event/${slug}`;
  const [tempSeat, setTempSeat] = useState({});
  const [isTempSeat, setIsTempSeat] = useState(false);
  const [event, setEvent] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [setToRoom, setSetToRoom] = useState([]);
  const [seatOccupied, setSeatOccupied] = useState([]);

  const handleSeatClick = (seat) => {
    const isSelected = selectedSeats?.some((s) => s._id === seat._id);
    setTempSeat(seat);
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter((s) => s._id !== seat._id));
      setIsTempSeat(false);
    } else {
      setSelectedSeats([...selectedSeats, seat]);
      setIsTempSeat(true);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getEvent(slug);
        setEvent(res);
        console.log(res);
      } catch (e) {
        console.log(e);
      }
    };
    fetchData();
  }, [slug]);

  useEffect(() => {
    const handleRouteChange = (url) => {
      if (socket.current) {
        socket.current?.emit('leave-room', eventRoom);
        socket.current?.off('seat-book');
      }
    };
    router.events.on('beforeHistoryChange', handleRouteChange);
    return () => {
      router.events.off('beforeHistoryChange', handleRouteChange);
    };
  }, [router]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      socket.current?.disconnect();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const sendBookSeat = () => {
      socket.current?.emit('seat-book', {
        room: eventRoom,
        seatId: tempSeat?._id,
        state: isTempSeat,
      });
    };
    sendBookSeat();
  }, [tempSeat, isTempSeat]);
  useEffect(() => {
    if (!socket.current) {
      socket.current = io(apiEndpoint, { transports: ['websocket'] });
    }
    if (socket.current) {
      socket.current?.emit('join-room', eventRoom);
      socket.current?.on('seat-book', (params) => {
        const deserializedParams = params.map((param) => ({
          ...param,
          seatId: param.seatId?.toString(),
          state: !!param.state,
        }));
        setSetToRoom(deserializedParams);
      });
    }
  }, [setToRoom]);
  useEffect(() => {
    if (!socket.current) {
      socket.current = io(apiEndpoint, { transports: ['websocket'] });
    }
    if (socket.current) {
      socket.current?.on('seat-occupied', (params) => {
        const deserializedParams = params.map((param) => param.toString());
        setSeatOccupied(deserializedParams);
      });
    }
  }, [seatOccupied]);
  return (
    <>
      {!event && <Loading />}
      {event && (
        <>
          <Layout>
            <div className={styles.event}>
              <div className={styles.container}>
                <div className={styles.header}>
                  <div className={styles.image}>
                    <img
                      src={event.image}
                      alt="event-image"
                      style={{
                        objectFit: 'cover',
                        objectPosition: 'center',
                        width: '100%',
                        borderRadius: '10px',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.body}>
              <div className={styles.grid}>
                <div className={styles.wrapper}>
                  <div className={styles.content}>
                    <div className={styles.box}>
                      <div className={styles.name}>{event.name}</div>
                      <div className={styles.date}>
                        <span>
                          From: {event.dateStart} to {event.dateEnd}
                        </span>
                      </div>
                      <div className={styles.venue}>
                        <span>{event.venue}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.description}>
                  <div className={styles.content}>{event.description}</div>
                </div>
                <div className={styles.seat}>
                  <div className={styles.seatWrapper}>
                    <div className={styles.hall}>
                      {event?.seats.map((seatRow, indexRow) => (
                        <div key={indexRow} className={styles.row}>
                          {seatRow.map((seat, indexCol) => (
                            <React.Fragment key={seat._id}>
                              {seat.isOccupied ||
                              seatOccupied.includes(seat._id) ? (
                                <div
                                  style={{ background: 'rgb(65, 66, 70)' }}
                                  className={styles.occupied}
                                  key={`${indexRow}-${indexCol}`}
                                >
                                  {seat.row} - {seat.col}
                                </div>
                              ) : (
                                <div
                                  className={styles.seat}
                                  style={{
                                    background: selectedSeats?.some(
                                      (s) => s._id === seat._id
                                    )
                                      ? 'rgb(120, 205, 4)'
                                      : setToRoom?.some(
                                          (s) =>
                                            s.seatId === seat._id && s.state
                                        )
                                      ? 'red'
                                      : 'rgb(96, 93, 169)',
                                  }}
                                  key={`${indexRow}-${indexCol}`}
                                  onClick={() => handleSeatClick(seat)}
                                >
                                  {seat.row} - {seat.col}
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className={styles.seatInfoContainer}>
                      <div className={styles.seatInfo}>
                        <div
                          className={styles.seatLabel}
                          style={{ background: 'rgb(96, 93, 169)' }}
                        ></div>
                        Available
                      </div>
                      <div className={styles.seatInfo}>
                        <div
                          className={styles.seatLabel}
                          style={{ background: 'rgb(65, 66, 70)' }}
                        ></div>
                        Reserved
                      </div>
                      <div className={styles.seatInfo}>
                        <div
                          className={styles.seatLabel}
                          style={{ background: 'rgb(120, 205, 4)' }}
                        ></div>
                        Selected
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.checkout}>
                <BookingCheckout
                  selectedSeats={selectedSeats}
                  ticketPrice={event?.ticketPrice}
                  user={user}
                  event={event}
                />
              </div>
            </div>
          </Layout>
          <Footer />
        </>
      )}
    </>
  );
};

export const getServerSideProps = async ({ req, params }) => {
  const { slug } = params;
  const authenticationCheck = await checkAuthentication(req);

  if ('redirect' in authenticationCheck) {
    return authenticationCheck;
  }
  return {
    props: {
      slug,
      user: authenticationCheck.user,
    },
  };
};

export default Event;
