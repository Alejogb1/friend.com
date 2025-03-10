'use client'
import { Button } from '@/components/ui/button';
import { motion } from "framer-motion";
import { ChevronUp, RefreshCcw, Speech } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useTransition } from 'react';

export default function Header({ info }: any) {
  const [pending, startTransition] = useTransition()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div
      className="flex flex-col items-center max-w-screen-md w-full bg-white overflow-hidden"
      layout
    >
      <motion.header
        className="flex justify-between items-center w-full px-4 py-2"
        layout
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <motion.div
          className={`flex ${isExpanded && "flex-col"} justify-center items-center gap-3 cursor-pointer`}
          onClick={() => setIsExpanded(!isExpanded)}
          layout
        >
          <motion.span
            className="font-semibold"
            layout
            style={{ fontSize: isExpanded ? "2rem" : "1.25rem" }}
          >
            {info?.character?.name}
          </motion.span>
          <motion.div
            className="rounded-full overflow-hidden"
            layout
            style={{
              width: isExpanded ? "120px" : "48px",
              height: isExpanded ? "120px" : "48px"
            }}
          >
            <Image
              src={info?.character?.profile_image}
              alt="Profile"
              width={120}
              height={120}
              quality={95}
              priority
              className="w-full h-full object-cover"
              sizes={isExpanded ? "120px" : "48px"}
            />
          </motion.div>
        </motion.div>

        <motion.div className="flex items-center gap-4" layout transition={{ duration: 0.3, ease: "easeInOut" }}>
          <Link href="/character">
            <Button size="icon" variant="outline" className="p-2 rounded-full">
              <Speech />
            </Button>
          </Link>
        </motion.div>
      </motion.header>

      {isExpanded && (
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="mt-4 mb-2 cursor-pointer"
          onClick={() => setIsExpanded(false)}
        >
          <ChevronUp />
        </motion.div>
      )}
    </motion.div>
  )
}
